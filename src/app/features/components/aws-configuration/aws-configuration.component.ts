import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  AWSConfigurationService,
  AWSConfiguration,
  AWSStatusResponse,
  TestCredentialsResponse
} from '../../../core/services/awsconfiguration.service';

@Component({
  selector: 'app-aws-configuration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './aws-configuration.component.html',
  styleUrls: ['./aws-configuration.component.scss']
})
export class AwsConfigurationComponent implements OnInit, OnDestroy {
  configForm!: FormGroup;
  configurations: AWSConfiguration[] = [];
  awsStatus: AWSStatusResponse | null = null;
  selectedConfig: AWSConfiguration | null = null;
  availableRegions: string[] = [];
  
  loading = false;
  testing = false;
  testingCredentials = false;
  showForm = false;
  editMode = false;
  editingId: number | null = null;
  
  successMessage = '';
  errorMessage = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private awsConfigService: AWSConfigurationService,
    private router: Router
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadConfigurations();
    this.loadAWSStatus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.configForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      aws_access_key: ['', [Validators.required]],
      aws_secret_key: ['', [Validators.required]],
      aws_session_token: [''],
      aws_region: ['us-east-1', [Validators.required]],
      vpc_id: [''],
      security_group_id: [''],
      auto_block_enabled: [false],
      auto_block_threshold: [10],
      is_active: [true]
    });
  }

  // --- ACTIONS ---

  onSubmit(): void {
    if (this.configForm.invalid) {
      this.markFormGroupTouched(this.configForm);
      return;
    }

    const formData = this.prepareFormData();
    this.loading = true;

    if (this.editMode && this.editingId) {
      // UPDATE
      this.awsConfigService.updateConfiguration(this.editingId, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.handleSuccess('Configuration updated successfully', response.id);
          },
          error: (err) => this.handleError(err, 'Failed to update configuration')
        });
    } else {
      // CREATE
      this.awsConfigService.createConfiguration(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.handleSuccess('Configuration created successfully', response.id);
          },
          error: (err) => this.handleError(err, 'Failed to create configuration')
        });
    }
  }

  handleSuccess(msg: string, configId?: number): void {
    this.loading = false;
    this.showSuccess(msg);
    
    console.log('✅ Success! Configuration ID:', configId);
    console.log('⏳ Redirecting to Status page in 1.5s...');
    
    setTimeout(() => {
      this.navigateToStatus();
    }, 1500);
  }

  handleError(error: any, msg: string): void {
    this.loading = false;
    this.showError(msg);
    console.error(msg, error);
  }

  navigateToStatus(): void {
    console.log('🚀 Navigating to /awsstatus');
    this.router.navigate(['/awsstatus']).then(success => {
      if (success) {
        console.log('✅ Navigation successful');
      } else {
        console.error('❌ Navigation failed - Check app.routes.ts');
      }
    });
  }

  // --- LOADERS ---

  loadConfigurations(): void {
    this.awsConfigService.getConfigurations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.configurations = Array.isArray(data) ? data : (data as any).results || [];
        },
        error: (err) => console.error('Load config error', err)
      });
  }

  loadAWSStatus(): void {
    this.awsConfigService.getAWSStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status) => this.awsStatus = status,
        error: (err) => console.error('Load status error', err)
      });
  }

  // --- UTILS ---

  prepareFormData(): any {
    const raw = this.configForm.value;
    return {
      ...raw,
      aws_access_key: raw.aws_access_key?.trim(),
      aws_secret_key: raw.aws_secret_key?.trim(),
      aws_session_token: raw.aws_session_token?.trim()
    };
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }

  resetForm(): void {
    this.configForm.reset({
      aws_region: 'us-east-1',
      auto_block_threshold: 10,
      auto_block_enabled: false,
      is_active: true
    });
    this.editMode = false;
    this.editingId = null;
    this.showForm = false;
  }

  testCredentials(id: number): void {
    if (!id) return;
    this.testing = true;
    this.awsConfigService.testCredentials(id).subscribe({
      next: (res) => {
        this.testing = false;
        if(res.success) this.showSuccess("Credentials Valid ✅");
        else this.showError("Credentials Invalid ❌");
      },
      error: (err) => {
        this.testing = false;
        this.showError(err.message);
      }
    });
  }

  editConfiguration(config: AWSConfiguration): void {
    this.editMode = true;
    this.editingId = config.id!;
    this.showForm = true;
    this.configForm.patchValue(config);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteConfiguration(id: number): void {
    if(confirm('Delete this configuration?')) {
      this.awsConfigService.deleteConfiguration(id).subscribe({
        next: () => this.loadConfigurations()
      });
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 3000);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => this.errorMessage = '', 5000);
  }
}