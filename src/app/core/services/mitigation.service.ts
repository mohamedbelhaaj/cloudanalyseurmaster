import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';

export interface MitigationAction {
  id?: string;
  report?: number | null;
  action_type: string;
  target_value: string;
  aws_region: string;
  rule_number?: number;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  initiated_by?: {
    id: number;
    username: string;
    role: string;
  };
  initiated_by_username?: string;
  created_at?: string;
  completed_at?: string;
  error_message?: string;
}

export interface ExecuteActionResponse {
  success: boolean;
  message?: string;
  error?: string;
  action: MitigationAction;
}

export interface MitigationStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  failed: number;
  by_type: { [key: string]: number };
}

export interface MitigationsListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MitigationAction[];
}

@Injectable({
  providedIn: 'root'
})
export class MitigationService {
  private readonly apiUrl = 'http://127.0.0.1:8000/api';

  // Action type labels
  readonly ACTION_TYPES = [
    { value: 'block_ip', label: 'Block IP (Security Group)', icon: 'fa-shield-alt' },
    { value: 'block_ip_waf', label: 'Block IP (WAF)', icon: 'fa-fire-alt' },
    { value: 'block_ip_nacl', label: 'Block IP (NACL)', icon: 'fa-ban' },
    { value: 'isolate_instance', label: 'Isolate Instance (Quarantine)', icon: 'fa-lock' },
    { value: 'geo_block', label: 'Geo Block (WAF)', icon: 'fa-globe' },
    { value: 'rate_limit', label: 'Set Rate Limit (WAF)', icon: 'fa-tachometer-alt' },
    { value: 'update_firewall', label: 'Update Network Firewall', icon: 'fa-network-wired' }
  ];

  readonly AWS_REGIONS = [
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-east-2', label: 'US East (Ohio)' },
    { value: 'us-west-1', label: 'US West (N. California)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'eu-west-1', label: 'EU (Ireland)' },
    { value: 'eu-west-2', label: 'EU (London)' },
    { value: 'eu-west-3', label: 'EU (Paris)' },
    { value: 'eu-central-1', label: 'EU (Frankfurt)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
    { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Get all mitigation actions with pagination support
   */
  getMitigations(filters?: {
    status?: string;
    action_type?: string;
    report_id?: number;
    page?: number;
    page_size?: number;
  }): Observable<MitigationAction[]> {
    let url = `${this.apiUrl}/admin/mitigations/`;
    
    if (filters) {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.action_type) params.append('action_type', filters.action_type);
      if (filters.report_id) params.append('report', filters.report_id.toString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.page_size) params.append('page_size', filters.page_size.toString());
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
    }
    
    console.log('📡 Fetching mitigations from:', url);
    
    return this.http.get<any>(url).pipe(
      tap(response => {
        console.log('✅ Raw API response:', response);
      }),
      // Transform response to extract results array
      tap(response => {
        if (response && typeof response === 'object') {
          // Handle paginated response
          if (response.results && Array.isArray(response.results)) {
            console.log('✅ Paginated response with', response.results.length, 'items');
          }
          // Handle direct array response
          else if (Array.isArray(response)) {
            console.log('✅ Direct array response with', response.length, 'items');
          }
        }
      }),
      // Return the actual array, whether it's paginated or not
      tap((response: any) => {
        // This will be handled in the component
        return response;
      }),
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Get single mitigation action
   */
  getMitigation(id: string): Observable<MitigationAction> {
    const url = `${this.apiUrl}/admin/mitigations/${id}/`;
    
    console.log('📡 Fetching mitigation:', id);
    
    return this.http.get<MitigationAction>(url).pipe(
      tap(response => {
        console.log('✅ Mitigation received:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Create new mitigation action (status will be 'pending')
   */
  createMitigation(action: Partial<MitigationAction>): Observable<MitigationAction> {
    const url = `${this.apiUrl}/admin/mitigations/`;
    
    // Prepare payload - remove fields that shouldn't be sent
    const payload: any = {
      action_type: action.action_type,
      target_value: action.target_value,
      aws_region: action.aws_region || 'us-east-1',
      description: action.description
    };

    // Add optional fields only if they exist
    if (action.report) {
      payload.report = action.report;
    }

    // Add rule_number only for NACL actions
    if (action.action_type === 'block_ip_nacl' && action.rule_number) {
      payload.rule_number = action.rule_number;
    }
    
    console.log('📡 Creating mitigation with payload:', payload);
    
    return this.http.post<MitigationAction>(url, payload).pipe(
      tap(response => {
        console.log('✅ Mitigation created successfully:', response);
        console.log('   - ID:', response.id);
        console.log('   - Status:', response.status);
        console.log('   - Action Type:', response.action_type);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Update mitigation action
   */
  updateMitigation(id: string, action: Partial<MitigationAction>): Observable<MitigationAction> {
    const url = `${this.apiUrl}/admin/mitigations/${id}/`;
    
    // Prepare payload for update
    const payload: any = {};
    
    if (action.action_type) payload.action_type = action.action_type;
    if (action.target_value) payload.target_value = action.target_value;
    if (action.aws_region) payload.aws_region = action.aws_region;
    if (action.description) payload.description = action.description;
    if (action.rule_number) payload.rule_number = action.rule_number;
    if (action.report !== undefined) payload.report = action.report;
    
    console.log('📡 Updating mitigation:', id, 'with payload:', payload);
    
    return this.http.patch<MitigationAction>(url, payload).pipe(
      tap(response => {
        console.log('✅ Mitigation updated:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Delete mitigation action
   */
  deleteMitigation(id: string): Observable<void> {
    const url = `${this.apiUrl}/admin/mitigations/${id}/`;
    
    console.log('📡 Deleting mitigation:', id);
    
    return this.http.delete<void>(url).pipe(
      tap(() => {
        console.log('✅ Mitigation deleted:', id);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Execute mitigation action (This is the KEY method for execution)
   */
  executeMitigation(id: string): Observable<ExecuteActionResponse> {
    const url = `${this.apiUrl}/admin/mitigations/${id}/execute/`;
    
    console.log('📡 Executing mitigation:', id);
    console.log('   URL:', url);
    
    return this.http.post<ExecuteActionResponse>(url, {}).pipe(
      tap(response => {
        console.log('✅ Mitigation execution response:', response);
        console.log('   - Success:', response.success);
        console.log('   - Message:', response.message);
        console.log('   - Error:', response.error);
        console.log('   - New Status:', response.action?.status);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get mitigation statistics
   */
  getMitigationStats(): Observable<MitigationStats> {
    const url = `${this.apiUrl}/admin/mitigations/stats/`;
    
    console.log('📡 Fetching mitigation stats');
    
    return this.http.get<MitigationStats>(url).pipe(
      tap(response => {
        console.log('✅ Mitigation stats received:', response);
      }),
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Get action type label
   */
  getActionTypeLabel(actionType: string): string {
    const type = this.ACTION_TYPES.find(t => t.value === actionType);
    return type ? type.label : actionType;
  }

  /**
   * Get action type icon
   */
  getActionTypeIcon(actionType: string): string {
    const type = this.ACTION_TYPES.find(t => t.value === actionType);
    return type ? type.icon : 'fa-cog';
  }

  /**
   * Get region label
   */
  getRegionLabel(region: string): string {
    const r = this.AWS_REGIONS.find(reg => reg.value === region);
    return r ? r.label : region;
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'badge bg-warning text-dark',
      'in_progress': 'badge bg-info text-white',
      'completed': 'badge bg-success text-white',
      'failed': 'badge bg-danger text-white'
    };
    return statusMap[status] || 'badge bg-secondary';
  }

  /**
   * Get status icon
   */
  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'pending': 'fa-clock',
      'in_progress': 'fa-spinner fa-spin',
      'completed': 'fa-check-circle',
      'failed': 'fa-times-circle'
    };
    return iconMap[status] || 'fa-question-circle';
  }

  /**
   * Validate action before creation
   */
  validateAction(action: Partial<MitigationAction>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!action.action_type) {
      errors.push('Action type is required');
    }

    if (!action.target_value || action.target_value.trim() === '') {
      errors.push('Target value is required');
    }

    if (!action.aws_region) {
      errors.push('AWS region is required');
    }

    if (!action.description || action.description.trim() === '') {
      errors.push('Description is required');
    }

    // Validate IP format for IP blocking actions
    if (action.action_type?.includes('block_ip') && action.target_value) {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
      if (!ipRegex.test(action.target_value.trim())) {
        errors.push('Invalid IP address format. Use format: 192.168.1.1 or 192.168.1.0/24');
      }
    }

    // Validate instance ID format
    if (action.action_type === 'isolate_instance' && action.target_value) {
      const instanceRegex = /^i-[a-f0-9]{8,17}$/;
      if (!instanceRegex.test(action.target_value.trim())) {
        errors.push('Invalid EC2 instance ID format. Should start with "i-"');
      }
    }

    // Validate rule number for NACL
    if (action.action_type === 'block_ip_nacl') {
      if (!action.rule_number || action.rule_number < 1 || action.rule_number > 32766) {
        errors.push('Rule number must be between 1 and 32766');
      }
    }

    // Validate country codes for geo_block
    if (action.action_type === 'geo_block' && action.target_value) {
      const codes = action.target_value.split(',').map(c => c.trim());
      const validCodes = codes.every(code => /^[A-Z]{2}$/.test(code));
      if (!validCodes) {
        errors.push('Country codes must be 2-letter ISO codes (e.g., US, CN, RU)');
      }
    }

    // Validate rate limit
    if (action.action_type === 'rate_limit' && action.target_value) {
      const rateLimit = parseInt(action.target_value);
      if (isNaN(rateLimit) || rateLimit < 100 || rateLimit > 20000000) {
        errors.push('Rate limit must be a number between 100 and 20,000,000');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Error handler
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
      console.error('❌ Client-side error:', error.error.message);
    } else {
      console.error(
        `❌ Server error ${error.status}\n` +
        `URL: ${error.url}\n` +
        `Message: ${error.message}\n` +
        `Body:`, error.error
      );

      switch (error.status) {
        case 0:
          errorMessage = 'Unable to connect to server. Check your connection and ensure the backend is running.';
          break;
        case 400:
          errorMessage = 'Bad request. Please check your input.';
          if (error.error) {
            if (typeof error.error === 'object') {
              const errors = Object.entries(error.error)
                .map(([field, msgs]) => {
                  const message = Array.isArray(msgs) ? msgs.join(', ') : msgs;
                  return `${field}: ${message}`;
                })
                .join('; ');
              errorMessage = errors || errorMessage;
            } else if (typeof error.error === 'string') {
              errorMessage = error.error;
            }
          }
          break;
        case 401:
          errorMessage = 'Unauthorized. Please login again.';
          break;
        case 403:
          errorMessage = 'Access forbidden. Admin privileges required.';
          break;
        case 404:
          errorMessage = 'Mitigation action not found.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          if (error.error && error.error.error) {
            errorMessage += ` Details: ${error.error.error}`;
          }
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.statusText}`;
      }

      // Extract specific error messages from response
      if (error.error) {
        if (error.error.detail) {
          errorMessage = error.error.detail;
        } else if (error.error.message) {
          errorMessage = error.error.message;
        } else if (error.error.error) {
          errorMessage = error.error.error;
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