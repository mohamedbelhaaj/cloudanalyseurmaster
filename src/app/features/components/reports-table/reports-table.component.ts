import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Report } from '../../../core/models/reports.model';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReportsService } from '../../../core/services/reports.service';
@Component({
  selector: 'app-reports-table',
  imports: [CommonModule, RouterModule],
  templateUrl: './reports-table.component.html',
  styleUrls: ['./reports-table.component.css'] // Changé de .scss à .css
})
export class ReportsTableComponent  implements OnInit {
  @Input() reports: Report[] = [];
  @Input() loading: boolean = false;
  @Output() onView = new EventEmitter<number>();
  @Output() onEdit = new EventEmitter<number>();
  @Output() onDelete = new EventEmitter<number>();
  @Output() onCreateTask = new EventEmitter<Report>();

  constructor(private router: Router) {}

  ngOnInit(): void {}

  viewReport(reportId: number): void {
    this.onView.emit(reportId);
  }

  editReport(reportId: number): void {
    this.onEdit.emit(reportId);
  }

  deleteReport(reportId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
      this.onDelete.emit(reportId);
    }
  }

  createTask(report: Report): void {
    this.router.navigate(['/tasks/create'], {
      queryParams: {
        reportId: report.id,
        reportTitle: report.input_value
      }
    });
  }
  trackByReportId(index: number, report: Report): number {
  return report.id;
}

  severityBadge(severity: string): string {
    const severityMap: { [key: string]: string } = {
      'low': 'badge-low',
      'medium': 'badge-medium',
      'high': 'badge-high',
      'critical': 'badge-critical'
    };
    return severityMap[severity] || 'badge-default';
  }

  statusBadge(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'status-pending',
      'in_progress': 'status-progress',
      'completed': 'status-completed',
      'archived': 'status-archived'
    };
    return statusMap[status] || 'status-default';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getInputTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      'url': 'URL',
      'ip': 'Adresse IP',
      'domain': 'Domaine',
      'email': 'Email',
      'hash': 'Hash',
      'file': 'Fichier',
      'text': 'Texte'
    };
    return typeMap[type] || type;
  }

  getSeverityLabel(severity: string): string {
    const severityMap: { [key: string]: string } = {
      'low': 'Faible',
      'medium': 'Moyen',
      'high': 'Élevé',
      'critical': 'Critique'
    };
    return severityMap[severity] || severity;
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'En attente',
      'in_progress': 'En cours',
      'completed': 'Terminé',
      'archived': 'Archivé'
    };
    return statusMap[status] || status;
  }
}