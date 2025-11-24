import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Report } from '../../../core/models/reports.model';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReportsService } from '../../../core/services/reports.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models/user.model';

@Component({
  selector: 'app-reports-table',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reports-table.component.html',
  styleUrls: ['./reports-table.component.scss']
})
export class ReportsTableComponent implements OnInit {
  reports: Report[] = [];
  currentUser: User | null = null;
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  
  // Pagination
  currentPage: number = 1;
  totalCount: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  
  // Filters
  filterForm!: FormGroup;
  isFiltering: boolean = false;
  
  // User role
  isAdmin: boolean = false;
  isAnalyst: boolean = false;

  // Expose Math to template
  Math = Math;

  constructor(
    private reportsService: ReportsService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadCurrentUser();
    this.loadReports();
  }

  initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      status: [''],
      severity: [''],
      input_type: [''],
      search: ['']
    });
  }

  loadCurrentUser(): void {
    this.authService.currentUser$.subscribe({
      next: (user) => {
        this.currentUser = user;
        if (user) {
          this.isAdmin = user.role === 'admin';
          this.isAnalyst = user.role === 'analyst';
        }
      }
    });
  }

  loadReports(page: number = 1): void {
    this.loading = true;
    this.errorMessage = '';
    this.currentPage = page;

    const filters = this.getActiveFilters();

    this.reportsService.getReports(page, filters).subscribe({
      next: (response) => {
        this.reports = response.results;
        this.totalCount = response.count;
        this.totalPages = Math.ceil(this.totalCount / this.pageSize);
        this.loading = false;
      },
      error: (error: Error) => {
        console.error('Erreur lors du chargement des rapports:', error);
        this.errorMessage = error.message;
        this.loading = false;
      }
    });
  }

  getActiveFilters(): Record<string, any> {
    const filters: Record<string, any> = {};
    const formValue = this.filterForm.value;

    if (formValue.status) filters['status'] = formValue.status;
    if (formValue.severity) filters['severity'] = formValue.severity;
    if (formValue.input_type) filters['input_type'] = formValue.input_type;
    if (formValue.search) filters['search'] = formValue.search;

    return filters;
  }

  onFilterSubmit(): void {
    this.isFiltering = true;
    this.loadReports(1);
    setTimeout(() => {
      this.isFiltering = false;
    }, 500);
  }

  onClearFilters(): void {
    this.filterForm.reset({
      status: '',
      severity: '',
      input_type: '',
      search: ''
    });
    this.loadReports(1);
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.loadReports(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  viewReport(reportId: string): void {
    this.router.navigate(['/reports', reportId]);
  }

  editReport(reportId: string): void {
    this.router.navigate(['/reports', reportId, 'edit']);
  }

  deleteReport(reportId: string): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
      return;
    }

    this.reportsService.deleteReport(reportId).subscribe({
      next: () => {
        this.successMessage = 'Rapport supprimé avec succès';
        this.loadReports(this.currentPage);
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error: Error) => {
        console.error('Erreur lors de la suppression:', error);
        this.errorMessage = error.message;
      }
    });
  }

  createTask(report: Report): void {
    this.router.navigate(['/tasks'], {
      queryParams: {
        reportId: report.id,
        reportTitle: report.input_value
      }
    });
  }

  sendToAdmin(report: Report): void {
    this.router.navigate(['/sendtoadmin'], {
      queryParams: {
        reportId: report.id,
        reportTitle: report.input_value
      }
    });
  }

  downloadPdf(reportId: string): void {
    this.reportsService.downloadPdf(reportId).subscribe({
      next: () => {
        this.successMessage = 'PDF téléchargé avec succès';
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error: Error) => {
        console.error('Erreur lors du téléchargement:', error);
        this.errorMessage = 'Erreur lors du téléchargement du PDF';
      }
    });
  }

  // Helper methods
  getSeverityClass(severity: string): string {
    const map: { [key: string]: string } = {
      'low': 'severity-low',
      'medium': 'severity-medium',
      'high': 'severity-high',
      'critical': 'severity-critical',
      'informational': 'severity-informational'
    };
    return map[severity?.toLowerCase()] || 'severity-default';
  }

  getStatusClass(status: string): string {
    const map: { [key: string]: string } = {
      'pending': 'status-pending',
      'pending_review': 'status-pending',
      'in_progress': 'status-progress',
      'completed': 'status-completed',
      'archived': 'status-archived',
      'false_positive': 'status-false-positive'
    };
    return map[status?.toLowerCase()] || 'status-default';
  }

  getSeverityLabel(severity: string): string {
    const map: { [key: string]: string } = {
      'low': 'Faible',
      'medium': 'Moyen',
      'high': 'Élevé',
      'critical': 'Critique',
      'informational': 'Informatif'
    };
    return map[severity?.toLowerCase()] || severity;
  }

  getStatusLabel(status: string): string {
    const map: { [key: string]: string } = {
      'pending': 'En attente',
      'pending_review': 'En attente de révision',
      'in_progress': 'En cours',
      'completed': 'Terminé',
      'archived': 'Archivé',
      'false_positive': 'Faux positif'
    };
    return map[status?.toLowerCase()] || status;
  }

  getInputTypeLabel(type: string): string {
    const map: { [key: string]: string } = {
      'url': 'URL',
      'ip': 'Adresse IP',
      'domain': 'Domaine',
      'email': 'Email',
      'hash': 'Hash',
      'file': 'Fichier',
      'text': 'Texte'
    };
    return map[type?.toLowerCase()] || type;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPaginationRange(): number[] {
    const range: number[] = [];
    const delta = 2; // Pages to show around current page

    for (let i = Math.max(2, this.currentPage - delta); i <= Math.min(this.totalPages - 1, this.currentPage + delta); i++) {
      range.push(i);
    }

    return range;
  }

  trackByReportId(index: number, report: Report): string {
    return report.id;
  }
}