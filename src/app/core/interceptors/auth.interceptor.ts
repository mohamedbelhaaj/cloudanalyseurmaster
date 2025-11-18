import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

/**
 * Intercepteur JWT :
 * 1. Ajoute le Bearer token à chaque requête (sauf login/refresh)
 * 2. En cas 401 : tentative de refresh automatique
 * 3. Si refresh échoue → logout + redirection login
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  /* 1. On laisse passer les requêtes d’auth */
  const skipUrls = ['/auth/login/', '/auth/token/refresh/'];
  if (skipUrls.some(url => req.url.includes(url))) return next(req);

  /* 2. Ajout du token courant */
  const token = auth.getAccessToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  /* 3. Envoi + gestion 401 */
  return next(authReq).pipe(
    catchError(err => {
      if (err.status !== 401) return throwError(() => err);

      /* 4. Refresh token puis relance la requête */
      return auth.refreshToken().pipe(
        switchMap(() => {
          const newToken = auth.getAccessToken();
          if (!newToken) return throwError(() => err); // pas de nouveau token
          return next(
            req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })
          );
        }),
        catchError(() => {
          /* 5. Échec du refresh → on déconnecte */
          auth.logout().subscribe();
          return throwError(() => err);
        })
      );
    })
  );
};