import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { 
  Report, 
  ReportDetail, 
  UpdateStatusRequest, 
  ReviewReportRequest 
} from '../models/reports.model';
import { SendToAdminRequest, SendToAdminResponse } from '@core/models/sendtoadmin';

interface PaginatedReportResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Report[];
}

interface DownloadResult {
  success: boolean;
  filename: string;
  blob: Blob;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = 'http://127.0.0.1:8000/api/reports';

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('access_token')?.trim();
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Accept', 'application/json');
    
    return headers;
  }

  getReports(page: number = 1, filters?: Record<string, any>): Observable<PaginatedReportResponse> {
    let params = new HttpParams().set('page', page.toString());
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key].toString());
        }
      });
    }

    console.log('Fetching reports from:', this.apiUrl);
    console.log('With params:', params.toString());
    console.log('With headers:', this.headers());

    return this.http.get<PaginatedReportResponse>(this.apiUrl, { 
      params, 
      headers: this.headers() 
    }).pipe(
      tap(response => {
        console.log('Reports API Response:', response);
        console.log('Number of reports:', response.results?.length || 0);
      }),
      catchError(this.handleError)
    );
  }

  getReportById(id: string): Observable<ReportDetail> {
    console.log('Fetching report by ID:', id);
    
    return this.http.get<ReportDetail>(`${this.apiUrl}/${id}/`, { 
      headers: this.headers() 
    }).pipe(
      tap(report => console.log('Report detail received:', report)),
      catchError(this.handleError)
    );
  }

  createReport(reportData: Partial<Report>): Observable<Report> {
    return this.http.post<Report>(`${this.apiUrl}/`, reportData, { 
      headers: this.headers() 
    }).pipe(
      tap(report => console.log('Report created:', report)),
      catchError(this.handleError)
    );
  }

  updateReportStatus(id: string, data: UpdateStatusRequest): Observable<Report> {
    return this.http.post<Report>(`${this.apiUrl}/${id}/update_status/`, data, { 
      headers: this.headers() 
    }).pipe(
      tap(report => console.log('Report status updated:', report)),
      catchError(this.handleError)
    );
  }

  reviewReport(id: string, action: 'approve' | 'false_positive'): Observable<Report> {
    return this.http.post<Report>(`${this.apiUrl}/${id}/review/`, { action }, { 
      headers: this.headers() 
    }).pipe(
      tap(report => console.log('Report reviewed:', report)),
      catchError(this.handleError)
    );
  }

  downloadPdf(id: string): Observable<DownloadResult> {
    const token = localStorage.getItem('access_token')?.trim();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token || ''}`);

    return this.http.get(`${this.apiUrl}/${id}/download_pdf/`, {
      responseType: 'blob',
      observe: 'response',
      headers: headers
    }).pipe(
      map((response: HttpResponse<Blob>) => {
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `report_${id}.pdf`;
        
        if (contentDisposition) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        const blob = response.body as Blob;
        
        if (!blob || blob.size === 0) {
          throw new Error('Le fichier PDF est vide');
        }

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => window.URL.revokeObjectURL(url), 100);

        return {
          success: true,
          filename: filename,
          blob: blob
        };
      }),
      catchError(this.handleError)
    );
  }

  getPdfBlob(id: string): Observable<{ blob: Blob; filename: string }> {
    const token = localStorage.getItem('access_token')?.trim();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token || ''}`);

    return this.http.get(`${this.apiUrl}/${id}/download_pdf/`, {
      responseType: 'blob',
      observe: 'response',
      headers: headers
    }).pipe(
      map((response: HttpResponse<Blob>) => {
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `report_${id}.pdf`;
        
        if (contentDisposition) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        return {
          blob: response.body as Blob,
          filename: filename
        };
      }),
      catchError(this.handleError)
    );
  }

  sendToAdmin(reportId: string, adminId: number, message?: string): Observable<SendToAdminResponse> {
    return this.http.post<SendToAdminResponse>(`${this.apiUrl}/${reportId}/send-admin/`, {
      adminId,
      message
    }, { headers: this.headers() })
    .pipe(
      tap(response => console.log('Sent to admin:', response)),
      catchError(this.handleError)
    );
  }

  deleteReport(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`, { 
      headers: this.headers() 
    }).pipe(
      tap(() => console.log('Report deleted:', id)),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';
    
    console.error('HTTP Error Details:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      error: error.error
    });

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur réseau: ${error.error.message}`;
      console.error('Erreur côté client:', error.error.message);
    } else if (error.error instanceof Blob) {
      return new Observable(observer => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorObj = JSON.parse(reader.result as string);
            errorMessage = errorObj.detail || errorObj.error || 'Erreur lors du téléchargement';
          } catch {
            errorMessage = 'Erreur lors du téléchargement du PDF';
          }
          console.error('Blob error message:', errorMessage);
          observer.error(new Error(errorMessage));
        };
        reader.onerror = () => {
          observer.error(new Error('Erreur lors du téléchargement du PDF'));
        };
        reader.readAsText(error.error);
      });
    } else {
      switch (error.status) {
        case 0:   
          errorMessage = 'Impossible de contacter le serveur. Vérifiez que le backend est démarré sur http://127.0.0.1:8000'; 
          break;
        case 400: 
          errorMessage = 'Données invalides.'; 
          break;
        case 401: 
          errorMessage = 'Non autorisé. Veuillez vous reconnecter.'; 
          break;
        case 403: 
          errorMessage = 'Accès refusé.'; 
          break;
        case 404: 
          errorMessage = 'Rapport non trouvé.'; 
          break;
        case 500: 
          errorMessage = 'Erreur serveur.'; 
          break;
        default:  
          errorMessage = `Erreur ${error.status}: ${error.statusText}`;
      }
      
      if (error.error && typeof error.error === 'object') {
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
        if (error.error.detail) {
          errorMessage = error.error.detail;
        }
      }
    }
    
    console.error('Final error message:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}