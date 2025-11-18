import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // 1. Requêtes qu’on ne doit pas enrichir
  if (req.url.includes('/auth/login/') || req.url.includes('/auth/token/refresh/')) {
    return next(req);
  }

  // 2. Ajout du token courant
  const token = auth.getAccessToken();
  const reqWithAuth = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  // 3. Envoi + gestion 401
  return next(reqWithAuth).pipe(
    catchError(err => {
      if (err.status !== 401) return throwError(() => err);

      // Tentative de refresh
      return auth.refreshToken().pipe(
        switchMap(() => {
          const newToken = auth.getAccessToken();
          return next(
            req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })
          );
        }),
        catchError(refreshErr => {
          auth.logout();          // pas besoin de subscribe, synchrone
          router.navigate(['/login']);
          return throwError(() => refreshErr);
        })
      );
    })
  );
};