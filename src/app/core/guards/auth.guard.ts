import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';

type Role = User['role'];

const roleHome: Record<Role, string> = {
  analyst: '/dashboard',
  admin: '/dashboardadmin',
};

const roleGuardFactory = (allowedRoles: Role[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.getCurrentUserValue();

    if (!auth.isAuthenticated() || !user) {
      router.navigate(['/login']);
      return false;
    }

    if (allowedRoles.includes(user.role)) {
      return true;
    }

    const redirectTarget = roleHome[user.role] ?? '/login';
    router.navigate([redirectTarget]);
    return false;
  };
};

export const analystGuard = roleGuardFactory(['analyst']);
export const adminGuard = roleGuardFactory(['admin']);