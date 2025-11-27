import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-navbar-admin',
  standalone:true,
  imports: [ RouterModule,CommonModule],
  templateUrl: './navbar-admin.component.html',
  styleUrl: './navbar-admin.component.scss'
})
export class NavbarAdminComponent implements OnInit {
  currentUser$: Observable<any>;
  hasNotifications = false;
  notificationCount = 0;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Charger les notifications si nécessaire
    this.loadNotifications();
  }

  loadNotifications(): void {
    // TODO: Implémenter la logique de chargement des notifications
    // this.notificationService.getUnreadCount().subscribe(count => {
    //   this.notificationCount = count;
    //   this.hasNotifications = count > 0;
    // });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Même en cas d'erreur, rediriger vers login
        this.router.navigate(['/login']);
      }
    });
  }
}