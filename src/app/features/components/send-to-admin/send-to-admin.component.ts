import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportsService } from '../../../core/services/reports.service'
import { SendToAdminResponse } from '../../../core/models/sendtoadmin'
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-send-to-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './send-to-admin.component.html',
  styleUrls: ['./send-to-admin.component.scss']
})
export class SendToAdminComponent implements OnInit {
  reportId!: number;
  reportTitle: string = '';
  adminUsers: User[] = [];
  selectedAdminId: string = '';
  message: string = '';
  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private reportsService: ReportsService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getRouteParams();
    this.loadAdminUsers();
  }

  getRouteParams(): void {
    this.route.queryParams.subscribe(params => {
      this.reportId = Number(params['reportId']);
      this.reportTitle = params['reportTitle'] || 'Rapport sans titre';
    });
  }

  loadAdminUsers(): void {
    this.authService.getAdminUsers().subscribe({
      next: (users: User[]) => {
        this.adminUsers = users;
      },
      error: (error: Error) => {
        console.error('Erreur lors du chargement des admins:', error);
        this.errorMessage = 'Impossible de charger la liste des administrateurs';
      }
    });
  }

  onSubmit(): void {
    if (!this.selectedAdminId) {
      this.errorMessage = 'Veuillez sélectionner un administrateur';
      return;
    }

    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.reportsService.sendToAdmin(
      this.reportId, 
      Number(this.selectedAdminId),
      this.message || undefined
    ).subscribe({
      next: (res: SendToAdminResponse) => {
        this.successMessage = 'Rapport envoyé avec succès à l\'administrateur';
        console.log('Rapport assigné:', res);
        
        setTimeout(() => {
          this.router.navigate(['/reports'], {
            queryParams: { success: 'Rapport assigné avec succès' }
          });
        }, 1500);
      },
      error: (err: Error) => {
        console.error('Erreur lors de l\'envoi:', err);
        this.errorMessage = err.message || 'Erreur lors de l\'envoi du rapport';
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/reports', this.reportId]);
  }
}
