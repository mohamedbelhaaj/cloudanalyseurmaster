import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface AWSConfiguration {
  id?: number;
  name: string;
  aws_access_key: string;
  aws_secret_key?: string;
  aws_session_token: string;
  aws_region: string;
  vpc_id: string;
  security_group_id: string;
  isolation_sg_id: string;
  nacl_id: string;
  waf_web_acl_name: string;
  waf_web_acl_id: string;
  waf_ip_set_name: string;
  waf_ip_set_id: string;
  network_firewall_arn: string;
  log_group_name: string;
  auto_block_enabled: boolean;
  auto_block_threshold: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  owner?: number;
}

export interface AWSConfigurationListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AWSConfiguration[];
}

export interface TestCredentialsResponse {
  success: boolean;
  message: string;
  regions: string[];
}

export interface AWSStatusResponse {
  configured: boolean;
  connected: boolean;
  message?: string;
  error?: string;
  config?: {
    name: string;
    region: string;
    vpc_id: string;
    security_group_id: string;
    waf_configured: boolean;
    nacl_configured: boolean;
    firewall_configured: boolean;
    last_updated: string;
    auto_block_enabled: boolean;
    auto_block_threshold: number;
  };
  regions_available?: string[];
  vpc_info?: {
    cidr_block: string;
    subnets_count: number;
  };
  security_group?: {
    ingress_rules_count: number;
    egress_rules_count: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AWSConfigurationService {
  private apiUrl = 'http://localhost:8000/api/admin';
  private configurationSubject = new BehaviorSubject<AWSConfiguration | null>(null);
  public configuration$ = this.configurationSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  /**
   * Create a new AWS configuration
   */
  createConfiguration(config: Partial<AWSConfiguration>): Observable<AWSConfiguration> {
    return this.http.post<AWSConfiguration>(
      `${this.apiUrl}/aws-config/`,
      config,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => this.configurationSubject.next(response))
    );
  }

  /**
   * Get all AWS configurations
   */
  getConfigurations(): Observable<AWSConfigurationListResponse> {
    return this.http.get<AWSConfigurationListResponse>(
      `${this.apiUrl}/aws-config/`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get a specific AWS configuration by ID
   */
  getConfiguration(id: number): Observable<AWSConfiguration> {
    return this.http.get<AWSConfiguration>(
      `${this.apiUrl}/aws-config/${id}/`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Update an existing AWS configuration
   */
  updateConfiguration(id: number, config: Partial<AWSConfiguration>): Observable<AWSConfiguration> {
    return this.http.put<AWSConfiguration>(
      `${this.apiUrl}/aws-config/${id}/`,
      config,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => this.configurationSubject.next(response))
    );
  }

  /**
   * Delete an AWS configuration
   */
  deleteConfiguration(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/aws-config/${id}/`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Test AWS credentials for a specific configuration
   */
  testCredentials(id: number): Observable<TestCredentialsResponse> {
    return this.http.post<TestCredentialsResponse>(
      `${this.apiUrl}/aws-config/${id}/test_credentials/`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get current AWS status and active configuration
   */
  getAWSStatus(): Observable<AWSStatusResponse> {
    return this.http.get<AWSStatusResponse>(
      `${this.apiUrl}/aws-status/`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Refresh AWS status (force check)
   */
  refreshAWSStatus(): Observable<AWSStatusResponse> {
    return this.http.post<AWSStatusResponse>(
      `${this.apiUrl}/aws-status/refresh/`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Activate a specific configuration
   */
  activateConfiguration(id: number): Observable<AWSConfiguration> {
    return this.http.patch<AWSConfiguration>(
      `${this.apiUrl}/aws-config/${id}/`,
      { is_active: true },
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => this.configurationSubject.next(response))
    );
  }

  /**
   * Deactivate a specific configuration
   */
  deactivateConfiguration(id: number): Observable<AWSConfiguration> {
    return this.http.patch<AWSConfiguration>(
      `${this.apiUrl}/aws-config/${id}/`,
      { is_active: false },
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => this.configurationSubject.next(response))
    );
  }

  /**
   * Get human-readable region label
   */
  getRegionLabel(regionCode: string): string {
    const regionMap: { [key: string]: string } = {
      'us-east-1': 'US East (N. Virginia)',
      'us-east-2': 'US East (Ohio)',
      'us-west-1': 'US West (N. California)',
      'us-west-2': 'US West (Oregon)',
      'eu-west-1': 'Europe (Ireland)',
      'eu-west-2': 'Europe (London)',
      'eu-west-3': 'Europe (Paris)',
      'eu-central-1': 'Europe (Frankfurt)',
      'eu-north-1': 'Europe (Stockholm)',
      'ap-northeast-1': 'Asia Pacific (Tokyo)',
      'ap-northeast-2': 'Asia Pacific (Seoul)',
      'ap-northeast-3': 'Asia Pacific (Osaka)',
      'ap-southeast-1': 'Asia Pacific (Singapore)',
      'ap-southeast-2': 'Asia Pacific (Sydney)',
      'ap-south-1': 'Asia Pacific (Mumbai)',
      'ca-central-1': 'Canada (Central)',
      'sa-east-1': 'South America (São Paulo)'
    };
    return regionMap[regionCode] || regionCode;
  }
}