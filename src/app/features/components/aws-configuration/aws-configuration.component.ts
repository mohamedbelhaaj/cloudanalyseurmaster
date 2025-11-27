// aws-configuration.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AWSConfigurationService, AWSConfiguration, TestCredentialsResponse } from '@core/services/awsconfiguration.service';

@Component({
  selector: 'app-aws-configuration',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './aws-configuration.component.html',
  styleUrl: './aws-configuration.component.scss'
})
export class AwsConfigurationComponent implements OnInit {
  configurations: AWSConfiguration[] = [];
  configForm: FormGroup;
  isEditing = false;
  editingId: number | null = null;
  showForm = false;
  loading = false;
  testingCredentials = false;
  credentialTestResult: TestCredentialsResponse | null = null;
  availableRegions: string[] = [];
  errorMessage: string = '';
  successMessage: string = '';
  
  awsRegions = [
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-east-2', label: 'US East (Ohio)' },
    { value: 'us-west-1', label: 'US West (N. California)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'eu-west-1', label: 'EU (Ireland)' },
    { value: 'eu-west-2', label: 'EU (London)' },
    { value: 'eu-west-3', label: 'EU (Paris)' },
    { value: 'eu-central-1', label: 'EU (Frankfurt)' },
    { value: 'eu-north-1', label: 'EU (Stockholm)' },
    { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
    { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
    { value: 'ap-northeast-2', label: 'Asia Pacific (Seoul)' },
    { value: 'ap-northeast-3', label: 'Asia Pacific (Osaka)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
    { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
    { value: 'ca-central-1', label: 'Canada (Central)' },
    { value: 'sa-east-1', label: 'South America (São Paulo)' }
  ];

  constructor(
    private fb: FormBuilder,
    private awsConfigService: AWSConfigurationService
  ) {
    this.configForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadConfigurations();
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      aws_access_key: ['', [Validators.required, Validators.minLength(16)]],
      aws_secret_key: ['', [Validators.minLength(20)]],
      aws_session_token: [''],
      aws_region: ['us-east-1', Validators.required],
      vpc_id: ['', [Validators.pattern(/^vpc-[a-f0-9]{8,17}$/)]],
      security_group_id: ['', [Validators.pattern(/^sg-[a-f0-9]{8,17}$/)]],
      isolation_sg_id: ['', [Validators.pattern(/^sg-[a-f0-9]{8,17}$/)]],
      nacl_id: ['', [Validators.pattern(/^acl-[a-f0-9]{8,17}$/)]],
      waf_web_acl_name: [''],
      waf_web_acl_id: [''],
      waf_ip_set_name: [''],
      waf_ip_set_id: [''],
      network_firewall_arn: [''],
      log_group_name: [''],
      auto_block_enabled: [false],
      auto_block_threshold: [10, [Validators.min(1), Validators.max(50)]],
      is_active: [true]
    });
  }

  loadConfigurations(): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.awsConfigService.getConfigurations().subscribe({
      next: (configs) => {
        this.configurations = configs;
        this.loading = false;
        console.log('✅ Loaded configurations:', configs);
      },
      error: (error) => {
        console.error('❌ Error loading configurations:', error);
        this.errorMessage = error.message || 'Failed to load configurations';
        this.loading = false;
      }
    });
  }

  openCreateForm(): void {
    this.showForm = true;
    this.isEditing = false;
    this.editingId = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.credentialTestResult = null;
    
    this.configForm.reset({
      aws_region: 'us-east-1',
      auto_block_enabled: false,
      auto_block_threshold: 10,
      is_active: true
    });
    
    // Set aws_secret_key as required for new configurations
    this.configForm.get('aws_secret_key')?.setValidators([
      Validators.required,
      Validators.minLength(20)
    ]);
    this.configForm.get('aws_secret_key')?.updateValueAndValidity();
  }

  openEditForm(config: AWSConfiguration): void {
    this.showForm = true;
    this.isEditing = true;
    this.editingId = config.id || null;
    this.errorMessage = '';
    this.successMessage = '';
    this.credentialTestResult = null;
    
    // Prepare form data - don't populate secret key for security
    const formData = { ...config };
    delete formData.aws_secret_key;
    
    this.configForm.patchValue(formData);
    
    // Make secret key optional for updates
    this.configForm.get('aws_secret_key')?.clearValidators();
    this.configForm.get('aws_secret_key')?.updateValueAndValidity();
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingId = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.credentialTestResult = null;
    this.configForm.reset();
  }

  onSubmit(): void {
    // Clear previous messages
    this.errorMessage = '';
    this.successMessage = '';

    // Validate form
    if (this.configForm.invalid) {
      this.markFormGroupTouched(this.configForm);
      this.errorMessage = 'Please fix the form errors before submitting.';
      return;
    }

    this.loading = true;
    const formData = this.prepareFormData();

    console.log('📤 Submitting AWS configuration:', formData);

    const request = this.isEditing && this.editingId
      ? this.awsConfigService.updateConfiguration(this.editingId, formData)
      : this.awsConfigService.createConfiguration(formData);

    request.subscribe({
      next: (config) => {
        console.log('✅ Configuration saved successfully:', config);
        this.successMessage = `Configuration ${this.isEditing ? 'updated' : 'created'} successfully!`;
        this.loading = false;
        
        // Reload configurations and close form after a short delay
        setTimeout(() => {
          this.loadConfigurations();
          this.closeForm();
        }, 1500);
      },
      error: (error) => {
        console.error('❌ Error saving configuration:', error);
        this.errorMessage = error.message || 'Failed to save configuration';
        this.loading = false;
      }
    });
  }

  private prepareFormData(): any {
    const formData = { ...this.configForm.value };

    // Remove empty optional fields
    Object.keys(formData).forEach(key => {
      if (formData[key] === '' || formData[key] === null) {
        delete formData[key];
      }
    });

    // For editing, remove secret key if it's empty
    if (this.isEditing && !formData.aws_secret_key) {
      delete formData.aws_secret_key;
    }

    // Ensure numeric values
    if (formData.auto_block_threshold) {
      formData.auto_block_threshold = parseInt(formData.auto_block_threshold, 10);
    }

    return formData;
  }

  testCredentials(configId: number): void {
    this.testingCredentials = true;
    this.credentialTestResult = null;
    this.errorMessage = '';

    this.awsConfigService.testCredentials(configId).subscribe({
      next: (result) => {
        console.log('✅ Credential test result:', result);
        this.credentialTestResult = result;
        if (result.regions) {
          this.availableRegions = result.regions;
        }
        this.testingCredentials = false;
      },
      error: (error) => {
        console.error('❌ Credential test failed:', error);
        this.credentialTestResult = {
          success: false,
          error: error.message || 'Failed to test credentials'
        };
        this.testingCredentials = false;
      }
    });
  }

  setActiveConfiguration(configId: number): void {
    if (!confirm('Set this configuration as active? The current active configuration will be deactivated.')) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.awsConfigService.setActiveConfiguration(configId).subscribe({
      next: (result) => {
        console.log('✅ Active configuration set:', result);
        this.successMessage = 'Configuration set as active successfully!';
        this.loadConfigurations();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error setting active configuration:', error);
        this.errorMessage = error.message || 'Failed to set active configuration';
        this.loading = false;
      }
    });
  }

  deleteConfiguration(configId: number): void {
    if (!confirm('Are you sure you want to delete this configuration? This action cannot be undone.')) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.awsConfigService.deleteConfiguration(configId).subscribe({
      next: () => {
        console.log('✅ Configuration deleted:', configId);
        this.successMessage = 'Configuration deleted successfully!';
        this.loadConfigurations();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error deleting configuration:', error);
        this.errorMessage = error.message || 'Failed to delete configuration';
        this.loading = false;
      }
    });
  }

  getResources(configId: number): void {
    this.loading = true;
    this.errorMessage = '';

    this.awsConfigService.getResources(configId).subscribe({
      next: (result) => {
        console.log('✅ AWS Resources:', result);
        // TODO: Display resources in a modal or separate view
        alert('Resources loaded successfully! Check console for details.');
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error loading resources:', error);
        this.errorMessage = error.message || 'Failed to load resources';
        this.loading = false;
      }
    });
  }

  syncResources(configId: number): void {
    if (!confirm('Sync AWS resources for this configuration?')) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.awsConfigService.syncResources(configId).subscribe({
      next: (result) => {
        console.log('✅ Resources synced:', result);
        this.successMessage = 'Resources synced successfully!';
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error syncing resources:', error);
        this.errorMessage = error.message || 'Failed to sync resources';
        this.loading = false;
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Helper method to check if field has error
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.configForm.get(fieldName);
    if (!field) return false;
    
    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  // Helper method to get error message for a field
  getErrorMessage(fieldName: string): string {
    const field = this.configForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.hasError('required')) return `${fieldName} is required`;
    if (field.hasError('minlength')) {
      const minLength = field.errors['minlength'].requiredLength;
      return `${fieldName} must be at least ${minLength} characters`;
    }
    if (field.hasError('pattern')) return `Invalid ${fieldName} format`;
    if (field.hasError('min')) return `Minimum value is ${field.errors['min'].min}`;
    if (field.hasError('max')) return `Maximum value is ${field.errors['max'].max}`;

    return 'Invalid input';
  }
}