import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
 import { User } from '../models/user.model';
import { catchError, map } from 'rxjs/operators';
import { Task, TaskCreateRequest } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://localhost:8000/api/tasks';

  constructor(private http: HttpClient) {}

  getTasks(params?: any): Observable<Response[]> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return this.http.get<Response[]>(this.apiUrl, { params: httpParams })
      .pipe(
        catchError(this.handleError)
      );
  }

  getTaskById(id: number): Observable<Response> {
    return this.http.get<Response>(`${this.apiUrl}/${id}/`)
      .pipe(
        catchError(this.handleError)
      );
  }

  createTask(task: TaskCreateRequest): Observable<Response> {
    return this.http.post<Response>(`${this.apiUrl}/`, task)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateTask(id: number, task: Partial<Task>): Observable<Response> {
    return this.http.put<Response>(`${this.apiUrl}/${id}/`, task)
      .pipe(
        catchError(this.handleError)
      );
  }

  patchTask(id: number, task: Partial<Task>): Observable<Response> {
    return this.http.patch<Response>(`${this.apiUrl}/${id}/`, task)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getAdminUsers(): Observable<User[]> {
    return this.http.get<User[]>('http://localhost:8000/api/users/', {
      params: new HttpParams().set('role', 'admin')
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      if (error.status === 400) {
        errorMessage = 'Données invalides';
      } else if (error.status === 403) {
        errorMessage = 'Accès refusé';
      } else if (error.status === 404) {
        errorMessage = 'Ressource non trouvée';
      } else if (error.status === 500) {
        errorMessage = 'Erreur serveur';
      }
      
      if (error.error && typeof error.error === 'object') {
        const errors = Object.values(error.error).flat();
        if (errors.length > 0) {
          errorMessage = errors.join(', ');
        }
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}