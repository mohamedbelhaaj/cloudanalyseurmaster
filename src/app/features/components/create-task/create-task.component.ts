import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../../core/models/user.model';
import { TaskCreateRequest } from '../../../core/models/task.model';
import { TaskService } from '@core/services/task.service';

@Component({
  selector: 'app-create-task',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './create-task.component.html',
  styleUrls: ['./create-task.component.scss']
})
export class CreateTaskComponent implements OnInit {
  taskForm!: FormGroup;
  adminUsers: User[] = [];
  reportId: string = '';
  reportTitle: string = '';
  isSubmitting = false;
  errorMessage: string = '';
  minDate: string = '';
  isLoadingUsers = false;

  priorities = [
    { value: 'urgent', label: 'Urgente' },
    { value: 'high', label: 'Élevée' },
    { value: 'medium', label: 'Moyenne' },
    { value: 'low', label: 'Faible' }
  ];

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadAdminUsers();
    this.getReportInfo();
    this.setMinDate();
  }

  initializeForm(): void {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      priority: ['medium', Validators.required],
      assigned_to: ['', Validators.required],
      due_date: ['', Validators.required]
    });
  }

  setMinDate(): void {
    const today = new Date();
    this.minDate = today.toISOString().slice(0, 16);
  }

  loadAdminUsers(): void {
    this.isLoadingUsers = true;
    this.errorMessage = '';
    this.taskService.getAdminUsers().subscribe({
      next: (response: any) => {
        if (Array.isArray(response)) {
          this.adminUsers = response;
        } else if (response && Array.isArray(response.results)) {
          this.adminUsers = response.results;
        } else if (response && Array.isArray(response.data)) {
          this.adminUsers = response.data;
        } else if (response && typeof response === 'object') {
          this.adminUsers = Object.values(response);
        } else {
          this.adminUsers = [];
          this.errorMessage = 'Format de réponse inattendu du serveur';
        }
        this.isLoadingUsers = false;
      },
      error: (error) => {
        this.adminUsers = [];
        this.errorMessage = 'Impossible de charger la liste des administrateurs';
        this.isLoadingUsers = false;
      }
    });
  }

  getReportInfo(): void {
    this.route.queryParams.subscribe(params => {
      const reportIdParam = params['reportId'];
      const reportTitleParam = params['reportTitle'];

      if (reportIdParam) {
        this.reportId = reportIdParam;
      } else {
        this.reportId = '';
      }
      
      this.reportTitle = reportTitleParam || 'Rapport sans titre';
    });
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      this.markFormGroupTouched(this.taskForm);
      return;
    }
    if (this.isSubmitting) return;

    if (!this.reportId) {
      this.errorMessage = 'ID de rapport invalide ou manquant.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formValue = this.taskForm.value;

    const taskData: TaskCreateRequest = {
      title: String(formValue.title).trim(),
      description: String(formValue.description).trim(),
      priority: formValue.priority,
      assigned_to_id: +formValue.assigned_to,
      report_id: this.reportId,
      due_date: new Date(formValue.due_date).toISOString()
    };

    this.taskService.createTask(taskData).subscribe({
      next: () => {
        this.router.navigate(['/tasks'], { queryParams: { success: 'Tâche créée avec succès' } });
      },
      error: (error) => {
        if (error?.error && typeof error.error === 'object') {
          const errorMessages = Object.entries(error.error)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          this.errorMessage = errorMessages || 'Erreur lors de la création de la tâche';
        } else {
          this.errorMessage = error?.message || 'Erreur lors de la création de la tâche';
        }
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    if (this.reportId) {
      this.router.navigate(['/reports', this.reportId]);
    } else {
      this.router.navigate(['/tasksss']);
    }
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

  isFieldInvalid(fieldName: string): boolean {
    const field = this.taskForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.taskForm.get(fieldName);
    if (!field) return '';
    if (field.hasError('required')) return 'Ce champ est requis';
    if (field.hasError('minlength')) {
      const min = field.errors?.['minlength'].requiredLength;
      return `Minimum ${min} caractères requis`;
    }
    if (field.hasError('maxlength')) {
      const max = field.errors?.['maxlength'].requiredLength;
      return `Maximum ${max} caractères autorisés`;
    }
    return '';
  }
}