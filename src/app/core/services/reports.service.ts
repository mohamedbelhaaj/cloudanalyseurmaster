import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Report, ReportsResponse } from '../models/reports.model';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  // Update this to match your backend URL
  private apiUrl = 'http://localhost:8000/api/reports'; // Change this to your actual API URL

  constructor(private http: HttpClient) {}

  /**
   * Get paginated reports with optional filters
   */
  getReports(page: number = 1, filters?: Record<string, any>): Observable<ReportsResponse> {
    let httpParams = new HttpParams().set('page', page.toString());
    
    // Add filters to params
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          httpParams = httpParams.set(key, filters[key]);
        }
      });
    }

    return this.http.get<ReportsResponse>(this.apiUrl, { params: httpParams });
  }

  /**
   * Get a single report by ID
   */
  getReportById(id: string): Observable<Report> {
    return this.http.get<Report>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new report
   */
  createReport(data: Partial<Report>): Observable<Report> {
    return this.http.post<Report>(this.apiUrl, data);
  }

  /**
   * Update an existing report
   */
  updateReport(id: string, data: Partial<Report>): Observable<Report> {
    return this.http.put<Report>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Delete a report
   */
  deleteReport(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Download PDF report as Blob
   * This method downloads the PDF file directly
   */
  downloadPdf(reportId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${reportId}/pdf/`, {
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': 'application/pdf'
      })
    });
  }

  /**
   * Alternative: Get PDF URL if your backend returns a URL
   */
  getPdfUrl(reportId: string): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.apiUrl}/${reportId}/pdf-url/`);
  }

  /**
   * Download PDF by URL (if backend returns URL)
   */
  downloadPdfByUrl(url: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = `report-${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}