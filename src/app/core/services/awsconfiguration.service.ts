// services/awsconfiguration.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';

export interface AWSConfiguration {
  id?: number;
  owner?: number;
  name: string;
  aws_access_key: string;
  aws_secret_key?: string;
  aws_session_token?: string;
  aws_region: string;
  vpc_id?: string;
  security_group_id?: string;
  isolation_sg_id?: string;
  nacl_id?: string;
  waf_web_acl_name?: string;
  waf_web_acl_id?: string;
  waf_ip_set_name?: string;
  waf_ip_set_id?: string;
  network_firewall_arn?: string;
  log_group_name?: string;
  auto_block_enabled: boolean;
  auto_block_threshold: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TestCredentialsResponse {
  success: boolean;
  message?: string;
  regions?: string[];
  error?: string;
}

export interface AWSResourcesResponse {
  success: boolean;
  resources?: {
    vpcs?: any[];
    security_groups?: any[];
    instances?: any[];
    subnets?: any[];
  };
  error?: string;
}

export interface AWSStatusResponse {
  configured: boolean;
  connected: boolean;
  message?: string;
  error?: string;
  config?: {
    id: number;
    name: string;
    region: string;
    vpc_id?: string;
    security_group_id?: string;
    waf_configured?: boolean;
    nacl_configured?: boolean;
    firewall_configured?: boolean;
    auto_block_enabled: boolean;
    auto_block_threshold: number;
    last_updated: string;
  };
  vpc_info?: {
    cidr_block: string;
    subnets_count: number;
  };
  security_group?: {
    ingress_rules_count: number;
    egress_rules_count: number;
  };
  regions_available?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AWSConfigurationService {
  private readonly apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  /**
   * Get all AWS configurations
   */
  getConfigurations(): Observable<AWSConfiguration[]> {
    const url = `${this.apiUrl}/admin/aws-config/`;
    
    console.log('📡 Fetching AWS configurations from:', url);
    
    return this.http.get<AWSConfiguration[]>(url).pipe(
      tap(response => {
        console.log('✅ AWS configurations received:', response);
      }),
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Get single AWS configuration by ID
   */
  getConfiguration(id: number): Observable<AWSConfiguration> {
    const url = `${this.apiUrl}/admin/aws-config/${id}/`;
    
    console.log('📡 Fetching AWS configuration:', id);
    
    return this.http.get<AWSConfiguration>(url).pipe(
      tap(response => {
        console.log('✅ AWS configuration received:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Create new AWS configuration
   */
  createConfiguration(config: Partial<AWSConfiguration>): Observable<AWSConfiguration> {
    const url = `${this.apiUrl}/admin/aws-config/`;
    
    console.log('📡 Creating AWS configuration:', config);
    
    return this.http.post<AWSConfiguration>(url, config).pipe(
      tap(response => {
        console.log('✅ AWS configuration created:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Update existing AWS configuration
   */
  updateConfiguration(id: number, config: Partial<AWSConfiguration>): Observable<AWSConfiguration> {
    const url = `${this.apiUrl}/admin/aws-config/${id}/`;
    
    console.log('📡 Updating AWS configuration:', id, config);
    
    // Remove empty/null values to avoid overwriting with empty data
    const cleanConfig = Object.entries(config).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
    
    return this.http.patch<AWSConfiguration>(url, cleanConfig).pipe(
      tap(response => {
        console.log('✅ AWS configuration updated:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Delete AWS configuration
   */
  deleteConfiguration(id: number): Observable<any> {
    const url = `${this.apiUrl}/admin/aws-config/${id}/`;
    
    console.log('📡 Deleting AWS configuration:', id);
    
    return this.http.delete(url).pipe(
      tap(() => {
        console.log('✅ AWS configuration deleted:', id);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Test AWS credentials for a configuration
   */
  testCredentials(id: number): Observable<TestCredentialsResponse> {
    const url = `${this.apiUrl}/admin/aws-config/${id}/test_credentials/`;
    
    console.log('📡 Testing AWS credentials for config:', id);
    
    return this.http.post<TestCredentialsResponse>(url, {}).pipe(
      tap(response => {
        console.log('✅ Credentials test result:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Set configuration as active
   */
  setActiveConfiguration(id: number): Observable<AWSConfiguration> {
    const url = `${this.apiUrl}/admin/aws-config/${id}/set_active/`;
    
    console.log('📡 Setting active AWS configuration:', id);
    
    return this.http.post<AWSConfiguration>(url, {}).pipe(
      tap(response => {
        console.log('✅ Active configuration set:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get AWS resources for a configuration
   */
  getResources(id: number): Observable<AWSResourcesResponse> {
    const url = `${this.apiUrl}/admin/aws-config/${id}/get_resources/`;
    
    console.log('📡 Fetching AWS resources for config:', id);
    
    return this.http.get<AWSResourcesResponse>(url).pipe(
      tap(response => {
        console.log('✅ AWS resources received:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Sync AWS resources
   */
  syncResources(id: number): Observable<any> {
    const url = `${this.apiUrl}/admin/aws-config/${id}/sync_resources/`;
    
    console.log('📡 Syncing AWS resources for config:', id);
    
    return this.http.post(url, {}).pipe(
      tap(response => {
        console.log('✅ AWS resources synced:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get AWS Status (for dashboard and status monitoring)
   */
  getAWSStatus(): Observable<AWSStatusResponse> {
    const url = `${this.apiUrl}/admin/aws-status/`;
    
    console.log('📡 Fetching AWS status');
    
    return this.http.get<AWSStatusResponse>(url).pipe(
      tap(response => {
        console.log('✅ AWS status received:', response);
      }),
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Refresh AWS Status (force check)
   */
  refreshAWSStatus(): Observable<AWSStatusResponse> {
    const url = `${this.apiUrl}/admin/aws-status/refresh/`;
    
    console.log('📡 Refreshing AWS status');
    
    return this.http.post<AWSStatusResponse>(url, {}).pipe(
      tap(response => {
        console.log('✅ AWS status refreshed:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get region label from region code
   */
  getRegionLabel(regionCode: string): string {
    const regions: { [key: string]: string } = {
      'us-east-1': 'US East (N. Virginia)',
      'us-east-2': 'US East (Ohio)',
      'us-west-1': 'US West (N. California)',
      'us-west-2': 'US West (Oregon)',
      'eu-west-1': 'EU (Ireland)',
      'eu-west-2': 'EU (London)',
      'eu-west-3': 'EU (Paris)',
      'eu-central-1': 'EU (Frankfurt)',
      'eu-north-1': 'EU (Stockholm)',
      'ap-south-1': 'Asia Pacific (Mumbai)',
      'ap-northeast-1': 'Asia Pacific (Tokyo)',
      'ap-northeast-2': 'Asia Pacific (Seoul)',
      'ap-northeast-3': 'Asia Pacific (Osaka)',
      'ap-southeast-1': 'Asia Pacific (Singapore)',
      'ap-southeast-2': 'Asia Pacific (Sydney)',
      'ca-central-1': 'Canada (Central)',
      'sa-east-1': 'South America (São Paulo)'
    };
    return regions[regionCode] || regionCode;
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
        `Message: ${error.message}\n` +
        `Body:`, error.error
      );

      switch (error.status) {
        case 0:
          errorMessage = 'Unable to connect to server. Check your connection.';
          break;
        case 400:
          errorMessage = 'Bad request. Please check your input.';
          if (error.error) {
            // Try to extract field-specific errors
            if (typeof error.error === 'object') {
              const errors = Object.entries(error.error)
                .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                .join('; ');
              errorMessage = errors || errorMessage;
            }
          }
          break;
        case 401:
          errorMessage = 'Unauthorized. Please login again.';
          break;
        case 403:
          errorMessage = 'Access forbidden. You do not have permission.';
          console.error('🔒 403 Error - Check:');
          console.error('  - User must be authenticated');
          console.error('  - User must have admin role');
          console.error('  - JWT token is valid');
          break;
        case 404:
          errorMessage = 'Configuration not found.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          break;
        case 503:
          errorMessage = 'Service unavailable. Please try again later.';
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