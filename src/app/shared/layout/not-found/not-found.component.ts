import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss'
})
export class NotFoundComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  goHome(): void {
    const user = this.authService.getCurrentUserValue();
    if (user) {
      const targetRoute = user.role === 'analyst' 
        ? '/dashboard' 
        : user.role === 'admin' 
          ? '/dashboardadmin' 
          : '/login';
      this.router.navigate([targetRoute]);
    } else {
      this.router.navigate(['/login']);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
