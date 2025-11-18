import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { AnalysisResult } from '../models/analysis.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyzeService {
   private readonly api = 'http://127.0.0.1:8000/api/analyze';
  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('access_token')?.trim();
    return new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
  }

  /** Analyse textuelle (IP, URL, hash, domaine) */
  analyzeText(input: string, engine: 'vt' | 'otx'): Observable<AnalysisResult> {
    if (!input.trim()) {
      return throwError(() => ({ error: { error: 'Valeur vide ou invalide.' } }));
    }
    return this.http.post<AnalysisResult>(
      `${this.api}/`,
      { input_value: input.trim(), engine_choice: engine },
      { headers: this.headers() }
    ).pipe(
      catchError(err => {
        // Gestion 400, 401, 500, etc.
        const msg = err.error?.error || 'Erreur inconnue';
        return throwError(() => ({ error: { error: msg } }));
      })
    );
  }

  /** Analyse de fichier */
  analyzeFile(file: File, engine: 'vt' | 'otx'): Observable<AnalysisResult> {
    const form = new FormData();
    form.append('file', file);
    form.append('engine_choice', engine);
    return this.http.post<AnalysisResult>(`${this.api}/`, form, {
      headers: this.headers().delete('Content-Type') // Laisse le navigateur gérer le boundary
    }).pipe(
      catchError(err => {
        const msg = err.error?.error || 'Erreur lors de l’envoi du fichier';
        return throwError(() => ({ error: { error: msg } }));
      })
    );
  }
}
