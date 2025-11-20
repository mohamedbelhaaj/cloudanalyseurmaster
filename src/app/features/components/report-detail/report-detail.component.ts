import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportsService } from '../../../core/services/reports.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReportDetail, UpdateStatusRequest, VTData, OTXData, IPInfoData } from '../../../core/models/reports.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './report-detail.component.html',
  styleUrls: ['./report-detail.component.css']
})
export class ReportDetailComponent implements OnInit {
  report: ReportDetail | null = null;
  currentUser: User | null = null;
  loading: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';
  
  statusForm!: FormGroup;
  isUpdatingStatus: boolean = false;

  vtData: VTData | null = null;
  otxData: OTXData | null = null;
  ipinfoData: IPInfoData | null = null;

  isAdmin: boolean = false;
  isAnalyst: boolean = false;

  constructor(
    private reportsService: ReportsService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeStatusForm();
    this.loadCurrentUser();
    this.loadReport();
  }

  initializeStatusForm(): void {
    this.statusForm = this.fb.group({
      status: ['', Validators.required],
      notes: ['']
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

  loadReport(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (!id) {
      this.errorMessage = 'ID de rapport invalide';
      this.loading = false;
      return;
    }

    this.reportsService.getReportById(id).subscribe({
      next: (report) => {
        this.report = report;
        
        // Parser les données JSON
        try {
          this.vtData = report.vt_data ? 
            (typeof report.vt_data === 'string' ? JSON.parse(report.vt_data) : report.vt_data) 
            : null;
          this.otxData = report.otx_data ? 
            (typeof report.otx_data === 'string' ? JSON.parse(report.otx_data) : report.otx_data) 
            : null;
          this.ipinfoData = report.ipinfo_data ? 
            (typeof report.ipinfo_data === 'string' ? JSON.parse(report.ipinfo_data) : report.ipinfo_data) 
            : null;
        } catch (e) {
          console.error('Erreur lors du parsing des données JSON:', e);
        }
        
        if (this.isAdmin) {
          this.statusForm.patchValue({
            status: report.status,
            notes: report.notes || ''
          });
        }
        
        this.loading = false;
      },
      error: (error: Error) => {
        console.error('Erreur lors du chargement du rapport:', error);
        this.errorMessage = error.message;
        this.loading = false;
      }
    });
  }

  onUpdateStatus(): void {
    if (this.statusForm.invalid || !this.report) {
      return;
    }

    this.isUpdatingStatus = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data: UpdateStatusRequest = {
      status: this.statusForm.value.status,
      notes: this.statusForm.value.notes
    };

    this.reportsService.updateReportStatus(this.report.id, data).subscribe({
      next: (updatedReport) => {
        this.successMessage = 'Statut mis à jour avec succès';
        this.report = { ...this.report!, ...updatedReport };
        this.isUpdatingStatus = false;
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error: Error) => {
        console.error('Erreur lors de la mise à jour:', error);
        this.errorMessage = error.message;
        this.isUpdatingStatus = false;
      }
    });
  }

  onReviewReport(action: 'approve' | 'false_positive'): void {
    if (!this.report || !confirm(`Êtes-vous sûr de vouloir ${action === 'approve' ? 'approuver' : 'marquer comme faux positif'} ce rapport ?`)) {
      return;
    }

    this.reportsService.reviewReport(this.report.id, action).subscribe({
      next: (updatedReport) => {
        this.successMessage = `Rapport ${action === 'approve' ? 'approuvé' : 'marqué comme faux positif'} avec succès`;
        this.report = { ...this.report!, ...updatedReport };
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error: Error) => {
        console.error('Erreur lors de la révision:', error);
        this.errorMessage = error.message;
      }
    });
  }

  downloadPdf(): void {
    if (!this.report) return;

    this.reportsService.downloadPdf(this.report.id).subscribe({
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

  navigateToCreateTask(): void {
    if (!this.report) return;
    
    this.router.navigate(['/tasks/create'], {
      queryParams: {
        reportId: this.report.id,
        reportTitle: this.report.input_value
      }
    });
  }

  navigateToSendToAdmin(): void {
    if (!this.report) return;
    
    this.router.navigate(['/reports/send-to-admin'], {
      queryParams: {
        reportId: this.report.id,
        reportTitle: this.report.input_value
      }
    });
  }

  navigateToCreateMitigation(): void {
    if (!this.report) return;
    
    this.router.navigate(['/mitigations/create'], {
      queryParams: {
        reportId: this.report.id
      }
    });
  }

  goBack(): void {
    if (this.isAdmin) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/reports']);
    }
  }

  getSeverityClass(severity: string): string {
    const map: { [key: string]: string } = {
      'Faible': 'severity-low',
      'low': 'severity-low',
      'Moyen': 'severity-medium',
      'medium': 'severity-medium',
      'Élevé': 'severity-high',
      'high': 'severity-high',
      'Critique': 'severity-critical',
      'critical': 'severity-critical',
      'Informatif': 'severity-informational',
      'informational': 'severity-informational'
    };
    return map[severity] || 'severity-default';
  }

  getStatusClass(status: string): string {
    const map: { [key: string]: string } = {
      'En attente': 'status-pending',
      'pending': 'status-pending',
      'pending_review': 'status-pending',
      'Examiné': 'status-reviewed',
      'in_progress': 'status-progress',
      'Atténué': 'status-mitigated',
      'completed': 'status-completed',
      'Faux positif': 'status-false-positive',
      'archived': 'status-archived'
    };
    return map[status] || 'status-default';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getVTScans(): { engine: string; detected: boolean; result: string }[] {
    if (!this.vtData || !this.vtData.scans) {
      return [];
    }

    return Object.entries(this.vtData.scans).map(([engine, result]) => ({
      engine,
      detected: result.detected,
      result: result.result || 'Clean'
    }));
  }

  getOTXPulses(): any[] {
    return this.otxData?.pulses || [];
  }
}