import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { 
  Report, 
  ReportDetail, 
  UpdateStatusRequest, 
  ReviewReportRequest 
}  from '../models/reports.model';
import { SendToAdminRequest, SendToAdminResponse } from '@core/models/sendtoadmin';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = 'http://localhost:8000/api/reports';
  

  
  constructor(private http: HttpClient) {}

  /**
   * Récupère la liste des rapports
   */
  getReports(filters?: any): Observable<Report[]> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined) {
          params = params.set(key, filters[key].toString());
        }
      });
    }

    return this.http.get<Report[]>(this.apiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupère un rapport par son ID avec toutes ses données
   */
  getReportById(id: number): Observable<ReportDetail> {
    return this.http.get<ReportDetail>(`${this.apiUrl}/${id}/`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Met à jour le statut et les notes d'un rapport (Admin uniquement)
   */
  updateReportStatus(id: number, data: UpdateStatusRequest): Observable<Report> {
    return this.http.post<Report>(`${this.apiUrl}/${id}/update_status/`, data)
      .pipe(catchError(this.handleError));
  }

  /**
   * Approuve ou marque comme faux positif un rapport (Admin uniquement)
   */
  reviewReport(id: number, action: 'approve' | 'false_positive'): Observable<Report> {
    return this.http.post<Report>(`${this.apiUrl}/${id}/review/`, { action })
      .pipe(catchError(this.handleError));
  }

  /**
   * Télécharge le PDF d'un rapport
   */
  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download_pdf/`, {
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map((response: HttpResponse<Blob>) => {
        // Extraire le nom du fichier de l'en-tête si disponible
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `report_${id}.pdf`;
        
        if (contentDisposition) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        // Créer un lien de téléchargement
        const blob = response.body as Blob;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);

        return blob;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Envoie un rapport à un administrateur
   */
 sendToAdmin(reportId: number, adminId: number, message?: string): Observable<SendToAdminResponse> {
  return this.http.post<SendToAdminResponse>(`/api/reports/${reportId}/send-admin`, {
    adminId,
    message
  });
}
  /**
   * Gestion centralisée des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur réseau: ${error.error.message}`;
      console.error('Erreur côté client:', error.error.message);
    } else {
      console.error(
        `Code d'erreur ${error.status}, ` +
        `Message: ${error.message}`
      );

      switch (error.status) {
        case 0:
          errorMessage = 'Impossible de contacter le serveur.';
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
    
    console.error('Erreur complète:', error);
    return throwError(() => new Error(errorMessage));
  }
}