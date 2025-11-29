import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './shared/layout/navbar/navbar.component';
import { AuthService } from './core/services/auth.service';
import { filter } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { NavbarAdminComponent } from '@features/admin/navbar-admin/navbar-admin.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, ReactiveFormsModule, NavbarAdminComponent],
  template: `
    <div class="app-container">
      <!-- Navbar for Analyst (regular user) -->
      <app-navbar *ngIf="showAnalystNavbar"></app-navbar>
      
      <!-- Navbar for Admin -->
      <app-navbar-admin *ngIf="showAdminNavbar"></app-navbar-admin>
      
      <main class="main-content" [class.with-navbar]="showAnalystNavbar || showAdminNavbar">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background-color: #f7fafc;
    }

    .main-content {
      min-height: calc(100vh - 64px);
    }

    .main-content.with-navbar {
      padding-top: 0;
    }

    .main-content:not(.with-navbar) {
      padding-top: 0;
      min-height: 100vh;
    }
  `]
})
export class AppComponent {
    title = 'threat-analysis-app';
  private router = inject(Router);
  private authService = inject(AuthService);
  
  showAnalystNavbar = false;
  showAdminNavbar = false;

  constructor() {
    // Listen to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateNavbarVisibility(event.url);
    });

    // Check initial route
    this.updateNavbarVisibility(this.router.url);
  }

  private updateNavbarVisibility(url: string): void {
    // Don't show any navbar on login page
    if (url.includes('/login')) {
      this.showAnalystNavbar = false;
      this.showAdminNavbar = false;
      return;
    }

    // Get current user role
const currentUser = this.authService.getCurrentUserValue();
    const isAdmin = currentUser?.role === 'admin';

    // Show admin navbar for admin routes OR if user is admin
    if (url.includes('/dashboard/admin') || url.includes('/dashboardadmin') || isAdmin) {
      this.showAnalystNavbar = false;
      this.showAdminNavbar = true;
    } else {
      // Show analyst navbar for regular routes
      this.showAnalystNavbar = true;
      this.showAdminNavbar = false;
    }
  }
}