import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, RouterModule } from '@angular/router';
import { AWSConfigurationService } from '@core/services/awsconfiguration.service';



interface AWSConfiguration {
  id?: number;
  owner?: number;
  name: string;
  aws_access_key: string;
  aws_secret_key?: string;
  aws_session_token?: string;
  aws_region: string;
  vpc_id?: string;
  security_group_id?: string;
  isolation_sg_id?: string;
  nacl_id?: string;
  waf_web_acl_name?: string;
  waf_web_acl_id?: string;
  waf_ip_set_name?: string;
  waf_ip_set_id?: string;
  network_firewall_arn?: string;
  log_group_name?: string;
  auto_block_enabled: boolean;
  auto_block_threshold: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface TestCredentialsResponse {
  success: boolean;
  message?: string;
  regions?: string[];
  error?: string;
}
@Component({
  selector: 'app-aws-configuration',
  standalone:true,
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
      name: ['', Validators.required],
      aws_access_key: ['', Validators.required],
      aws_secret_key: [''],
      aws_session_token: [''],
      aws_region: ['us-east-1', Validators.required],
      vpc_id: [''],
      security_group_id: [''],
      isolation_sg_id: [''],
      nacl_id: [''],
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
    this.awsConfigService.getConfigurations().subscribe({
      next: (configs) => {
        this.configurations = configs;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading configurations:', error);
        this.loading = false;
      }
    });
  }

  openCreateForm(): void {
    this.showForm = true;
    this.isEditing = false;
    this.editingId = null;
    this.configForm.reset({
      aws_region: 'us-east-1',
      auto_block_enabled: false,
      auto_block_threshold: 10,
      is_active: true
    });
    this.credentialTestResult = null;
  }

  openEditForm(config: AWSConfiguration): void {
    this.showForm = true;
    this.isEditing = true;
    this.editingId = config.id || null;
    
    // Don't populate the secret key for security
    const formData = { ...config };
    delete formData.aws_secret_key;
    
    this.configForm.patchValue(formData);
    this.credentialTestResult = null;
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingId = null;
    this.configForm.reset();
    this.credentialTestResult = null;
  }

  onSubmit(): void {
    if (this.configForm.invalid) {
      return;
    }

    this.loading = true;
    const formData = this.configForm.value;

    // Remove empty secret key if editing
    if (this.isEditing && !formData.aws_secret_key) {
      delete formData.aws_secret_key;
    }

    const request = this.isEditing
      ? this.awsConfigService.updateConfiguration(this.editingId!, formData)
      : this.awsConfigService.createConfiguration(formData);

    request.subscribe({
      next: (config) => {
        this.loadConfigurations();
        this.closeForm();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error saving configuration:', error);
        this.loading = false;
      }
    });
  }

  testCredentials(configId: number): void {
    this.testingCredentials = true;
    this.credentialTestResult = null;

    this.awsConfigService.testCredentials(configId).subscribe({
      next: (result) => {
        this.credentialTestResult = result;
        if (result.regions) {
          this.availableRegions = result.regions;
        }
        this.testingCredentials = false;
      },
      error: (error) => {
        this.credentialTestResult = {
          success: false,
          error: error.error?.error || 'Failed to test credentials'
        };
        this.testingCredentials = false;
      }
    });
  }

  setActiveConfiguration(configId: number): void {
    this.loading = true;
    this.awsConfigService.setActiveConfiguration(configId).subscribe({
      next: (result) => {
        this.loadConfigurations();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error setting active configuration:', error);
        this.loading = false;
      }
    });
  }

  deleteConfiguration(configId: number): void {
    if (!confirm('Are you sure you want to delete this configuration?')) {
      return;
    }

    this.loading = true;
    this.awsConfigService.deleteConfiguration(configId).subscribe({
      next: () => {
        this.loadConfigurations();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error deleting configuration:', error);
        this.loading = false;
      }
    });
  }

  getResources(configId: number): void {
    this.awsConfigService.getResources(configId).subscribe({
      next: (result) => {
        console.log('AWS Resources:', result);
        // Handle displaying resources in a modal or separate view
      },
      error: (error) => {
        console.error('Error loading resources:', error);
      }
    });
  }
}
