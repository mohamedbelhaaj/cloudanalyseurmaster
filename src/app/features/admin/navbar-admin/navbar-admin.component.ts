import { Component, inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-navbar-admin',
  imports: [],
  templateUrl: './navbar-admin.component.html',
  styleUrl: './navbar-admin.component.scss'
})
export class NavbarAdminComponent {
  private authService = inject(AuthService);
  
  currentUser$ = this.authService.currentUser$;

  logout(): void {
    this.authService.logout().subscribe();
  }

}
