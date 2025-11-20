import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, User, TokenRefreshResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
 
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user';
  private readonly apiUrl = environment.apiUrl; // Ajout de la propriété apiUrl

  constructor() {
    this.loadUserFromStorage();
  }

  /**
   * Authentifie un utilisateur
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login/`, credentials)
      .pipe(
        tap(response => {
          this.storeTokens(response.access, response.refresh);
          this.storeUser(response.user);
          this.currentUserSubject.next(response.user);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Déconnecte l'utilisateur
   */
  logout(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/logout/`, {})
      .pipe(
        tap(() => {
          this.clearStorage();
          this.currentUserSubject.next(null);
          this.router.navigate(['/login']);
        }),
        catchError((error) => {
          // Même en cas d'erreur, on déconnecte localement
          this.clearStorage();
          this.currentUserSubject.next(null);
          this.router.navigate(['/login']);
          return throwError(() => error);
        })
      );
  }

  /**
   * Déconnexion locale sans appel API
   */
  logoutLocal(): void {
    this.clearStorage();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Récupère la liste des utilisateurs administrateurs
   */
  getAdminUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/`, {
      params: new HttpParams().set('role', 'admin')
    }).pipe(catchError(this.handleError));
  }

  /**
   * Récupère tous les utilisateurs avec filtres optionnels
   */
  getUsers(filters?: { role?: string; is_active?: boolean }): Observable<User[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.role) {
        params = params.set('role', filters.role);
      }
      if (filters.is_active !== undefined) {
        params = params.set('is_active', filters.is_active.toString());
      }
    }

    return this.http.get<User[]>(`${this.apiUrl}/users/`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Rafraîchit le token d'accès
   */
  refreshToken(): Observable<TokenRefreshResponse> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return throwError(() => new Error('Aucun refresh token disponible'));
    }

    return this.http.post<TokenRefreshResponse>(
      `${environment.apiUrl}/auth/token/refresh/`,
      { refresh: refreshToken }
    ).pipe(
      tap(response => {
        this.storeAccessToken(response.access);
      }),
      catchError((error) => {
        // Si le refresh token est invalide, déconnecter l'utilisateur
        this.logoutLocal();
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère les informations de l'utilisateur courant depuis l'API
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/auth/user/`)
      .pipe(
        tap(user => {
          this.storeUser(user);
          this.currentUserSubject.next(user);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Récupère l'utilisateur courant depuis le BehaviorSubject (synchrone)
   */
  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Récupère le token d'accès
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Récupère le refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUserValue();
    return user?.role === role;
  }

  /**
   * Vérifie si l'utilisateur est admin
   */
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  /**
   * Vérifie si l'utilisateur est analyste
   */
  isAnalyst(): boolean {
    return this.hasRole('analyst');
  }

  /**
   * Stocke les tokens d'authentification
   */
  private storeTokens(access: string, refresh: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, access);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refresh);
  }

  /**
   * Stocke uniquement le token d'accès
   */
  private storeAccessToken(access: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, access);
  }

  /**
   * Stocke les informations de l'utilisateur
   */
  private storeUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Charge l'utilisateur depuis le localStorage au démarrage
   */
  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Erreur lors du parsing de l\'utilisateur:', error);
        this.clearStorage();
      }
    }
  }

  /**
   * Efface toutes les données d'authentification du localStorage
   */
  private clearStorage(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Gestion centralisée des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
      console.error('Erreur côté client:', error.error.message);
    } else {
      // Erreur côté serveur
      console.error(
        `Code d'erreur ${error.status}, ` +
        `Message: ${error.message}`
      );

      switch (error.status) {
        case 0:
          errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
          break;
        case 400:
          errorMessage = 'Données invalides. Veuillez vérifier votre saisie.';
          break;
        case 401:
          errorMessage = 'Identifiants incorrects ou session expirée.';
          break;
        case 403:
          errorMessage = 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée.';
          break;
        case 500:
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          break;
        case 503:
          errorMessage = 'Service temporairement indisponible.';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.statusText}`;
      }
      
      // Extraction des messages d'erreur du backend
      if (error.error) {
        if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (typeof error.error === 'object') {
          // Gestion spécifique pour les erreurs d'authentification Django
          if (error.error.detail) {
            errorMessage = error.error.detail;
          } else if (error.error.non_field_errors) {
            errorMessage = Array.isArray(error.error.non_field_errors)
              ? error.error.non_field_errors.join(', ')
              : error.error.non_field_errors;
          } else if (error.error.username || error.error.password) {
            const errors: string[] = [];
            if (error.error.username) {
              errors.push(`Nom d'utilisateur: ${error.error.username}`);
            }
            if (error.error.password) {
              errors.push(`Mot de passe: ${error.error.password}`);
            }
            errorMessage = errors.join(', ');
          } else {
            // Autres erreurs structurées
            const errors: string[] = [];
            Object.keys(error.error).forEach(key => {
              const value = error.error[key];
              if (Array.isArray(value)) {
                errors.push(...value);
              } else if (typeof value === 'string') {
                errors.push(value);
              }
            });
            if (errors.length > 0) {
              errorMessage = errors.join(' | ');
            }
          }
        }
      }
    }
    
    console.error('Erreur complète:', error);
    return throwError(() => new Error(errorMessage));
  }
  signup(userData: { username: string; email: string; password: string }): Observable<any> {
  return this.http.post(`${this.apiUrl}/signup`, userData);
}
  
}