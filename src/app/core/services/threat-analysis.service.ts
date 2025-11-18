import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AnalysisResult, AnalysisInput } from '@core/models/analysis.model';
import { environment } from '../../../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class ThreatAnalysisService {
private readonly api = 'http://127.0.0.1:8000/api/analyze';

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const t = localStorage.getItem('access_token')?.trim();
    return new HttpHeaders().set('Authorization', `Bearer ${t}`);
  }

  /* Analyse URL / Domain / IP / Hash */
  analyzeText(input: string, engine: 'vt' | 'otx'): Observable<AnalysisResult> {
    return this.http.post<AnalysisResult>(
      `${this.api}/`,
      { input_value: input.trim(), engine_choice: engine },
      { headers: this.headers() }
    );
  }

  /* Analyse Fichier */
  analyzeFile(file: File, engine: 'vt' | 'otx'): Observable<AnalysisResult> {
    const form = new FormData();
    form.append('file', file);
    form.append('engine_choice', engine);
    return this.http.post<AnalysisResult>(`${this.api}/`, form, { headers: this.headers() });
  }
}