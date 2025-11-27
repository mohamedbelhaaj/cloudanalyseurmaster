import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';

import { MitigationAction, MitigationService } from '@core/services/mitigation.service';

@Component({
  selector: 'app-migrations-table',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './migrations-table.component.html',
  styleUrl: './migrations-table.component.scss'
})
export class MigrationsTableComponent implements OnInit {
  mitigations: MitigationAction[] = [];
  filteredMitigations: MitigationAction[] = [];
  
  mitigationForm: FormGroup;
  showForm = false;
  isEditing = false;
  editingId: string | null = null;
  
  loading = false;
  executing: { [key: string]: boolean } = {};
  
  errorMessage = '';
  successMessage = '';
  
  // Filters
  selectedStatus = 'all';
  selectedActionType = 'all';
  searchTerm = '';

  // Stats
  stats = {
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    failed: 0
  };

  constructor(
    private fb: FormBuilder,
    public mitigationService: MitigationService
  ) {
    this.mitigationForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadMitigations();
  }

  createForm(): FormGroup {
    return this.fb.group({
      action_type: ['block_ip', Validators.required],
      target_value: ['', [Validators.required, Validators.minLength(7)]],
      aws_region: ['us-east-1', Validators.required],
      rule_number: [100, [Validators.min(1), Validators.max(32766)]],
      description: ['', Validators.required],
      report_id: [null]
    });
  }

  loadMitigations(): void {
    this.loading = true;
    this.errorMessage = '';

    this.mitigationService.getMitigations().subscribe({
      next: (response: any) => {
        console.log('✅ API Response:', response);
        
        // Handle different response formats
        if (Array.isArray(response)) {
          this.mitigations = response;
        } else if (response && Array.isArray(response.data)) {
          this.mitigations = response.data;
        } else if (response && Array.isArray(response.mitigations)) {
          this.mitigations = response.mitigations;
        } else {
          console.warn('Unexpected response format:', response);
          this.mitigations = [];
        }
        
        this.applyFilters();
        this.calculateStats();
        this.loading = false;
        console.log('✅ Loaded mitigations:', this.mitigations);
      },
      error: (error: any) => {
        console.error('❌ Error loading mitigations:', error);
        this.errorMessage = error.message || 'Failed to load mitigation actions';
        this.mitigations = [];
        this.filteredMitigations = [];
        this.loading = false;
      }
    });
  }

  calculateStats(): void {
    // Ensure mitigations is an array
    if (!Array.isArray(this.mitigations)) {
      this.mitigations = [];
    }
    
    this.stats.total = this.mitigations.length;
    this.stats.pending = this.mitigations.filter(m => m.status === 'pending').length;
    this.stats.in_progress = this.mitigations.filter(m => m.status === 'in_progress').length;
    this.stats.completed = this.mitigations.filter(m => m.status === 'completed').length;
    this.stats.failed = this.mitigations.filter(m => m.status === 'failed').length;
  }

  applyFilters(): void {
    // Ensure mitigations is an array
    if (!Array.isArray(this.mitigations)) {
      console.warn('mitigations is not an array:', this.mitigations);
      this.mitigations = [];
      this.filteredMitigations = [];
      return;
    }

    this.filteredMitigations = this.mitigations.filter(mitigation => {
      // Status filter
      if (this.selectedStatus !== 'all' && mitigation.status !== this.selectedStatus) {
        return false;
      }

      // Action type filter
      if (this.selectedActionType !== 'all' && mitigation.action_type !== this.selectedActionType) {
        return false;
      }

      // Search filter
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        return (
          mitigation.target_value.toLowerCase().includes(searchLower) ||
          mitigation.description.toLowerCase().includes(searchLower) ||
          mitigation.action_type.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  openCreateForm(): void {
    this.showForm = true;
    this.isEditing = false;
    this.editingId = null;
    this.errorMessage = '';
    this.successMessage = '';
    
    this.mitigationForm.reset({
      action_type: 'block_ip',
      aws_region: 'us-east-1',
      rule_number: 100
    });
  }

  openEditForm(mitigation: MitigationAction): void {
    this.showForm = true;
    this.isEditing = true;
    this.editingId = mitigation.id || null;
    this.errorMessage = '';
    this.successMessage = '';
    
    this.mitigationForm.patchValue({
      action_type: mitigation.action_type,
      target_value: mitigation.target_value,
      aws_region: mitigation.aws_region,
      rule_number: mitigation.rule_number,
      description: mitigation.description
    });
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingId = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.mitigationForm.reset();
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.mitigationForm.invalid) {
      this.markFormGroupTouched(this.mitigationForm);
      this.errorMessage = 'Please fix the form errors before submitting.';
      return;
    }

    const formData = this.mitigationForm.value;

    // Validate action
    const validation = this.mitigationService.validateAction(formData);
    if (!validation.valid) {
      this.errorMessage = validation.errors.join(', ');
      return;
    }

    this.loading = true;

    const request = this.isEditing && this.editingId
      ? this.mitigationService.updateMitigation(this.editingId, formData)
      : this.mitigationService.createMitigation(formData);

    request.subscribe({
      next: (mitigation: MitigationAction) => {
        console.log('✅ Mitigation saved:', mitigation);
        this.successMessage = `Mitigation action ${this.isEditing ? 'updated' : 'created'} successfully!`;
        this.loading = false;
        
        setTimeout(() => {
          this.loadMitigations();
          this.closeForm();
        }, 1500);
      },
      error: (error: any) => {
        console.error('❌ Error saving mitigation:', error);
        this.errorMessage = error.message || 'Failed to save mitigation action';
        this.loading = false;
      }
    });
  }

  executeMitigation(mitigation: MitigationAction): void {
    if (!mitigation.id) return;

    if (!confirm(`Execute mitigation action: ${this.mitigationService.getActionTypeLabel(mitigation.action_type)}?`)) {
      return;
    }

    this.executing[mitigation.id] = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.mitigationService.executeMitigation(mitigation.id).subscribe({
      next: (response: any) => {
        console.log('✅ Mitigation executed:', response);
        
        if (response.success) {
          this.successMessage = response.message || 'Mitigation action executed successfully!';
        } else {
          this.errorMessage = response.error || 'Mitigation action failed';
        }
        
        this.executing[mitigation.id!] = false;
        this.loadMitigations();
      },
      error: (error: any) => {
        console.error('❌ Error executing mitigation:', error);
        this.errorMessage = error.message || 'Failed to execute mitigation action';
        this.executing[mitigation.id!] = false;
      }
    });
  }

  deleteMitigation(mitigation: MitigationAction): void {
    if (!mitigation.id) return;

    if (!confirm(`Delete mitigation action: ${mitigation.target_value}?`)) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.mitigationService.deleteMitigation(mitigation.id).subscribe({
      next: () => {
        console.log('✅ Mitigation deleted');
        this.successMessage = 'Mitigation action deleted successfully!';
        this.loading = false;
        this.loadMitigations();
      },
      error: (error: any) => {
        console.error('❌ Error deleting mitigation:', error);
        this.errorMessage = error.message || 'Failed to delete mitigation action';
        this.loading = false;
      }
    });
  }

  canExecute(mitigation: MitigationAction): boolean {
    return mitigation.status === 'pending' || mitigation.status === 'failed';
  }

  isExecuting(mitigationId: string): boolean {
    return this.executing[mitigationId] || false;
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

  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.mitigationForm.get(fieldName);
    if (!field) return false;
    
    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.mitigationForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.hasError('required')) return `${fieldName} is required`;
    if (field.hasError('minlength')) {
      const minLength = field.errors['minlength'].requiredLength;
      return `${fieldName} must be at least ${minLength} characters`;
    }
    if (field.hasError('min')) return `Minimum value is ${field.errors['min'].min}`;
    if (field.hasError('max')) return `Maximum value is ${field.errors['max'].max}`;

    return 'Invalid input';
  }

  // UI Helper methods
  getActionTypeOptions() {
    return this.mitigationService.ACTION_TYPES;
  }

  getRegionOptions() {
    return this.mitigationService.AWS_REGIONS;
  }

  getStatusOptions() {
    return [
      { value: 'all', label: 'All Status' },
      { value: 'pending', label: 'Pending' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
      { value: 'failed', label: 'Failed' }
    ];
  }

  getActionTypeFilterOptions() {
    return [
      { value: 'all', label: 'All Action Types' },
      ...this.mitigationService.ACTION_TYPES
    ];
  }

  shouldShowRuleNumber(): boolean {
    const actionType = this.mitigationForm.get('action_type')?.value;
    return actionType === 'block_ip_nacl';
  }

  getTargetPlaceholder(): string {
    const actionType = this.mitigationForm.get('action_type')?.value;
    
    const placeholders: { [key: string]: string } = {
      'block_ip': '203.0.113.45 or 203.0.113.0/24',
      'block_ip_waf': '203.0.113.45/32',
      'block_ip_nacl': '203.0.113.45/32',
      'isolate_instance': 'i-0dd02b2aa07854832',
      'geo_block': 'CN, RU, KP (comma-separated)',
      'rate_limit': '1000 (requests per 5 minutes)',
      'default': 'Enter target value'
    };

    return placeholders[actionType] || placeholders['default'];
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  }

  getSuccessRate(): number {
    if (this.stats.total === 0) return 0;
    return Math.round((this.stats.completed / this.stats.total) * 100);
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}