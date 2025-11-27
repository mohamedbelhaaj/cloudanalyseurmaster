
// services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
export interface DashboardStats {
  overview: {
    total_reports: number;
    pending_reports: number;
    critical_reports: number;
    mitigated_reports: number;
  };
  severity_distribution: { [key: string]: number };
  status_distribution: { [key: string]: number };
  trends: {
    today: number;
    this_week: number;
    this_month: number;
  };
  tasks: {
    open: number;
    in_progress: number;
    completed: number;
    urgent: number;
  };
  mitigations: {
    pending: number;
    completed: number;
    failed: number;
  };
  top_threats: Array<{
    input_value: string;
    input_type: string;
    severity: string;
    count: number;
  }>;
  recent_critical: Array<any>;
}

export interface AWSStatus {
  vpc_status: string;
  security_groups: Array<{
    id: string;
    name: string;
    rules_count: number;
  }>;
  active_configurations: number;
  region: string;
  last_sync: string;
  ec2_instances?: number;
  network_acls?: number;
}

export interface AWSConfiguration {
  id: number;
  name: string;
  aws_region: string;
  vpc_id: string;
  security_group_id: string;
  is_active: boolean;
  access_key_id: string;
  created_at: string;
  updated_at: string;
}
@Injectable({
  providedIn: 'root'
})
export class DashboardService {
   private readonly apiUrl = 'http://127.0.0.1:8000/api';

 constructor(private http: HttpClient) {}

  /**
   * Get dashboard statistics
   * Note: L'intercepteur ajoute automatiquement le token Bearer
   */
  getDashboardStats(): Observable<DashboardStats> {
    const url = `${this.apiUrl}/admin/dashboard/`;
    
    console.log('📡 Fetching dashboard stats from:', url);
    console.log('🔑 Token key in localStorage:', this.getTokenKey());
    
    return this.http.get<DashboardStats>(url).pipe(
      tap(response => {
        console.log('✅ Dashboard stats received:', response);
      }),
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Get AWS infrastructure status
   */
  getAWSStatus(): Observable<AWSStatus> {
    const url = `${this.apiUrl}/admin/aws-status/`;
    
    console.log('📡 Fetching AWS status from:', url);
    
    return this.http.get<AWSStatus>(url).pipe(
      tap(response => {
        console.log('✅ AWS status received:', response);
      }),
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Get detailed analytics
   */
  getAnalytics(params?: {
    start_date?: string;
    end_date?: string;
    severity?: string;
  }): Observable<any> {
    let queryParams = '';
    if (params) {
      const paramPairs = Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`);
      if (paramPairs.length > 0) {
        queryParams = '?' + paramPairs.join('&');
      }
    }

    return this.http.get(`${this.apiUrl}/admin/analytics/${queryParams}`).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Get AWS configurations
   */
  getAWSConfigurations(): Observable<AWSConfiguration[]> {
    return this.http.get<AWSConfiguration[]>(`${this.apiUrl}/aws-configurations/`).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Create AWS configuration
   */
  createAWSConfiguration(config: Partial<AWSConfiguration>): Observable<AWSConfiguration> {
    return this.http.post<AWSConfiguration>(`${this.apiUrl}/aws-configurations/`, config).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Update AWS configuration
   */
  updateAWSConfiguration(id: number, config: Partial<AWSConfiguration>): Observable<AWSConfiguration> {
    return this.http.put<AWSConfiguration>(`${this.apiUrl}/aws-configurations/${id}/`, config).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Delete AWS configuration
   */
  deleteAWSConfiguration(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/aws-configurations/${id}/`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Test AWS connection
   */
  testAWSConnection(configId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/aws-configurations/${configId}/test-connection/`, {}).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Sync AWS resources
   */
  syncAWSResources(configId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/aws-configurations/${configId}/sync/`, {}).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get reports
   */
  getReports(filters?: {
    status?: string;
    severity?: string;
    limit?: number;
  }): Observable<any> {
    let queryParams = '';
    if (filters) {
      const paramPairs = Object.entries(filters)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${value}`);
      if (paramPairs.length > 0) {
        queryParams = '?' + paramPairs.join('&');
      }
    }

    return this.http.get(`${this.apiUrl}/reports/${queryParams}`).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Update report status
   */
  updateReportStatus(reportId: number, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/reports/${reportId}/`, { status }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get tasks
   */
  getTasks(filters?: {
    status?: string;
    priority?: string;
  }): Observable<any> {
    let queryParams = '';
    if (filters) {
      const paramPairs = Object.entries(filters)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${value}`);
      if (paramPairs.length > 0) {
        queryParams = '?' + paramPairs.join('&');
      }
    }

    return this.http.get(`${this.apiUrl}/tasks/${queryParams}`).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Update task
   */
  updateTask(taskId: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/tasks/${taskId}/`, data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Export dashboard data
   */
  exportDashboard(format: 'csv' | 'json' | 'pdf' = 'json'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/admin/dashboard/export/?format=${format}`, {
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Récupère la clé du token depuis localStorage
   */
  private getTokenKey(): string | null {
    return localStorage.getItem('access_token') || localStorage.getItem('auth_token');
  }

  /**
   * Error handler
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
      console.error('❌ Client-side error:', error.error.message);
    } else {
      // Server-side error
      console.error(
        `❌ Server error ${error.status}\n` +
        `URL: ${error.url}\n` +
        `Message: ${error.message}`
      );

      switch (error.status) {
        case 0:
          errorMessage = 'Unable to connect to server. Check your connection.';
          break;
        case 400:
          errorMessage = 'Bad request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please login again.';
          break;
        case 403:
          errorMessage = 'Access forbidden. You do not have permission.';
          console.error('🔒 403 Error - Check:');
          console.error('  - User role must be "admin"');
          console.error('  - JWT token is valid');
          console.error('  - Django permissions are correctly set');
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 500:
          errorMessage = 'Internal server error.';
          break;
        case 503:
          errorMessage = 'Service unavailable.';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.statusText}`;
      }

      // Extract error details from backend
      if (error.error) {
        if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error.detail) {
          errorMessage = error.error.detail;
        } else if (error.error.message) {
          errorMessage = error.error.message;
        }
      }
    }

    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      error: error.error
    }));
  }
}