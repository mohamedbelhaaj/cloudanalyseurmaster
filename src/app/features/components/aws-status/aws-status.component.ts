import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AWSConfigurationService, AWSStatusResponse } from '@core/services/awsconfiguration.service';
import { interval, Subscription } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-aws-status',  
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ReactiveFormsModule],
  templateUrl: './aws-status.component.html',
  styleUrl: './aws-status.component.scss'
})
export class AwsStatusComponent implements OnInit, OnDestroy {
  // State
  loading = true;
  statusData: AWSStatusResponse | null = null;
  error: string | undefined = undefined;

  // Auto-refresh
  private refreshSubscription?: Subscription;
  autoRefreshEnabled = true;
  refreshIntervalSeconds = 30;

  constructor(
    private awsConfigService: AWSConfigurationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStatus();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  // ==================== LOADING ====================

  /** Load AWS status */
  loadStatus(silent: boolean = false): void {
    if (!silent) {
      this.loading = true;
    }
    this.error = undefined;

    this.awsConfigService.getAWSStatus().subscribe({
      next: (data: AWSStatusResponse) => {
        this.statusData = data;
        this.loading = false;
        console.log('✅ AWS Status loaded:', data);
      },
      error: (error: any) => {
        console.error('❌ Error loading AWS status:', error);
        this.error = error.message || 'Failed to load AWS status';
        this.loading = false;

        // Create default status on error
        this.statusData = {
          configured: false,
          connected: false,
          message: this.error
        };
      }
    });
  }

  /** Refresh status (called manually) */
  refreshStatus(): void {
    this.loadStatus();
  }

  /** Force complete status check */
  forceRefresh(): void {
    this.loading = true;
    this.awsConfigService.refreshAWSStatus().subscribe({
      next: (data: AWSStatusResponse) => {
        this.statusData = data;
        this.loading = false;
        console.log('✅ AWS Status force refreshed');
      },
      error: (error: any) => {
        console.error('❌ Error forcing refresh:', error);
        this.error = error.message || 'Failed to refresh AWS status';
        this.loading = false;
      }
    });
  }

  // ==================== AUTO REFRESH ====================

  /** Start automatic refresh */
  startAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.stopAutoRefresh();
    }

    if (this.autoRefreshEnabled) {
      this.refreshSubscription = interval(this.refreshIntervalSeconds * 1000)
        .pipe(
          startWith(0),
          switchMap(() => this.awsConfigService.getAWSStatus())
        )
        .subscribe({
          next: (data: AWSStatusResponse) => {
            this.statusData = data;
            this.loading = false;
          },
          error: (error: any) => {
            console.error('❌ Auto-refresh error:', error);
            this.error = error.message || 'Auto-refresh failed';
          }
        });
    }
  }

  /** Stop automatic refresh */
  stopAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = undefined;
    }
  }

  /** Toggle automatic refresh */
  toggleAutoRefresh(): void {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    if (this.autoRefreshEnabled) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  // ==================== NAVIGATION ====================

  /** Navigate to configuration page */
  navigateToConfig(): void {
    this.router.navigate(['/awsconf']);
  }

  /** Navigate to specific resource */
  navigateToResource(resourceType: string): void {
    this.router.navigate(['/aws-resources', resourceType]);
  }

  // ==================== STATUS HELPERS ====================

  getConnectionStatus(): 'connected' | 'disconnected' | 'not-configured' | 'unknown' {
    if (!this.statusData) return 'unknown';
    if (!this.statusData.configured) return 'not-configured';
    if (this.statusData.connected) return 'connected';
    return 'disconnected';
  }

  getConnectionStatusText(): string {
    const status = this.getConnectionStatus();
    const statusMap: Record<string, string> = {
      'connected': 'Connected',
      'disconnected': 'Connection Failed',
      'not-configured': 'Not Configured',
      'unknown': 'Unknown'
    };
    return statusMap[status] || 'Unknown';
  }

  getConnectionStatusClass(): string {
    const status = this.getConnectionStatus();
    const classMap: Record<string, string> = {
      'connected': 'status-connected',
      'disconnected': 'status-disconnected',
      'not-configured': 'status-warning',
      'unknown': 'status-unknown'
    };
    return classMap[status] || 'status-unknown';
  }

  getConnectionStatusIcon(): string {
    const status = this.getConnectionStatus();
    const iconMap: Record<string, string> = {
      'connected': 'fa-check-circle',
      'disconnected': 'fa-times-circle',
      'not-configured': 'fa-exclamation-circle',
      'unknown': 'fa-question-circle'
    };
    return iconMap[status] || 'fa-question-circle';
  }

  isOperational(): boolean {
    return this.getConnectionStatus() === 'connected';
  }

  needsConfiguration(): boolean {
    return this.getConnectionStatus() === 'not-configured';
  }

  // ==================== REGION HELPERS ====================

  getRegionLabel(regionCode: string): string {
    return this.awsConfigService.getRegionLabel(regionCode);
  }

  getCurrentRegion(): string {
    return this.statusData?.config?.region || 'unknown';
  }

  // ==================== FEATURES HELPERS ====================

  getConfiguredFeaturesCount(): number {
    if (!this.statusData?.config) return 0;
    let count = 0;
    const config = this.statusData.config;
    if (config.vpc_id) count++;
    if (config.security_group_id) count++;
    if (config.waf_configured) count++;
    if (config.nacl_configured) count++;
    if (config.firewall_configured) count++;
    return count;
  }

  getTotalFeatures(): number {
    return 5;
  }

  getConfigurationPercentage(): number {
    const total = this.getTotalFeatures();
    const configured = this.getConfiguredFeaturesCount();
    return total > 0 ? Math.round((configured / total) * 100) : 0;
  }

  isFeatureConfigured(feature: string): boolean {
    if (!this.statusData?.config) return false;
    const config = this.statusData.config;
    const featureMap: Record<string, boolean> = {
      'vpc': !!config.vpc_id,
      'security_group': !!config.security_group_id,
      'waf': !!config.waf_configured,
      'nacl': !!config.nacl_configured,
      'firewall': !!config.firewall_configured
    };
    return featureMap[feature] || false;
  }

  getMissingFeatures(): string[] {
    const features = ['vpc', 'security_group', 'waf', 'nacl', 'firewall'];
    return features.filter(feature => !this.isFeatureConfigured(feature));
  }

  // ==================== RESOURCE HELPERS ====================

  hasResources(): boolean {
    return !!(this.statusData?.config?.vpc_id || this.statusData?.config?.security_group_id);
  }

  getResourcesCount(): number {
    if (!this.statusData?.config) return 0;
    let count = 0;
    const config = this.statusData.config;
    if (config.vpc_id) count++;
    if (config.security_group_id) count++;
    if (config.nacl_configured) count++;
    if (config.waf_configured) count++;
    if (config.firewall_configured) count++;
    return count;
  }

  // ==================== TIME HELPERS ====================

  getTimeSinceLastSync(): string {
    if (!this.statusData?.config?.last_updated) {
      return 'Never';
    }
    const lastUpdate = new Date(this.statusData.config.last_updated);
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  isRecentlyUpdated(): boolean {
    if (!this.statusData?.config?.last_updated) return false;
    const lastUpdate = new Date(this.statusData.config.last_updated);
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffMins = diffMs / 60000;
    return diffMins < 5;
  }

  getLastSyncFormatted(): string {
    if (!this.statusData?.config?.last_updated) return 'Never';
    const date = new Date(this.statusData.config.last_updated);
    return date.toLocaleString();
  }

  // ==================== VPC HELPERS ====================

  getVPCStatus(): string {
    if (!this.statusData?.config?.vpc_id) return 'not-configured';
    if (this.statusData.connected) return 'active';
    return 'error';
  }

  getVPCStatusBadgeClass(): string {
    const status = this.getVPCStatus();
    if (status === 'active') return 'badge bg-success';
    if (status === 'error') return 'badge bg-danger';
    if (status === 'not-configured') return 'badge bg-secondary';
    return 'badge bg-secondary';
  }

  getVPCStatusText(): string {
    const status = this.getVPCStatus();
    const statusMap: Record<string, string> = {
      'active': 'Active',
      'error': 'Error',
      'not-configured': 'Not Configured'
    };
    return statusMap[status] || status;
  }

  // ==================== SECURITY GROUPS HELPERS ====================

  hasSecurityGroups(): boolean {
    return !!this.statusData?.config?.security_group_id;
  }

  getSecurityGroupInfo(): any {
    return this.statusData?.security_group;
  }

  // ==================== CONFIGURATION HELPERS ====================

  isConfigured(): boolean {
    return this.statusData?.configured || false;
  }

  getConfigurationStatus(): string {
    if (!this.isConfigured()) return 'Not Configured';
    if (this.isOperational()) return 'Operational';
    return 'Configured but Disconnected';
  }

  getConfigurationStatusClass(): string {
    if (!this.isConfigured()) return 'text-warning';
    if (this.isOperational()) return 'text-success';
    return 'text-danger';
  }

  // ==================== AUTO BLOCK HELPERS ====================

  isAutoBlockEnabled(): boolean {
    return this.statusData?.config?.auto_block_enabled || false;
  }

  getAutoBlockThreshold(): number {
    return this.statusData?.config?.auto_block_threshold || 0;
  }

  // ==================== HEALTH SCORE ====================

  getHealthScore(): number {
    if (!this.statusData || !this.isConfigured()) return 0;
    
    let score = 0;
    
    // Connection status (40 points)
    if (this.isOperational()) score += 40;
    else if (this.isConfigured()) score += 10;
    
    // Resources configured (40 points)
    if (this.statusData.config?.vpc_id) score += 10;
    if (this.statusData.config?.security_group_id) score += 10;
    if (this.statusData.config?.waf_configured) score += 10;
    if (this.statusData.config?.nacl_configured) score += 5;
    if (this.statusData.config?.firewall_configured) score += 5;
    
    // Recent update (20 points)
    if (this.isRecentlyUpdated()) score += 20;
    else if (this.statusData.config?.last_updated) score += 10;
    
    return Math.min(score, 100);
  }

  getHealthLevel(): string {
    const score = this.getHealthScore();
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'Critical';
  }

  getHealthLevelClass(): string {
    const score = this.getHealthScore();
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-info';
    if (score >= 40) return 'text-warning';
    return 'text-danger';
  }

  getHealthProgressBarClass(): string {
    const score = this.getHealthScore();
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-info';
    if (score >= 40) return 'bg-warning';
    return 'bg-danger';
  }

  // ==================== SECURITY SCORE ====================

  getSecurityScore(): number {
    if (!this.statusData?.config) return 0;
    let score = 0;
    const config = this.statusData.config;
    
    if (config.vpc_id) score += 15;
    if (config.security_group_id) score += 15;
    if (config.waf_configured) score += 20;
    if (config.nacl_configured) score += 15;
    if (config.firewall_configured) score += 20;
    if (config.auto_block_enabled) score += 15;
    
    return Math.min(score, 100);
  }

  getSecurityLevel(): string {
    const score = this.getSecurityScore();
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'Critical';
  }

  getSecurityLevelClass(): string {
    const score = this.getSecurityScore();
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-info';
    if (score >= 40) return 'text-warning';
    return 'text-danger';
  }

  // ==================== EXPORT HELPERS ====================

  exportStatusAsJson(): void {
    if (!this.statusData) {
      console.warn('No status data to export');
      return;
    }

    const dataStr = JSON.stringify(this.statusData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aws-status-${new Date().toISOString()}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
    console.log('✅ Status exported as JSON');
  }

  copyStatusToClipboard(): void {
    if (!this.statusData) {
      console.warn('No status data to copy');
      return;
    }

    const statusText = JSON.stringify(this.statusData, null, 2);
    navigator.clipboard.writeText(statusText).then(() => {
      console.log('✅ Status copied to clipboard');
      // You could show a toast notification here
    }).catch((err: any) => {
      console.error('❌ Failed to copy status:', err);
    });
  }

  // ==================== DISPLAY HELPERS ====================

  shouldShowWarning(): boolean {
    return !this.isConfigured() || !this.isOperational();
  }

  getWarningMessage(): string {
    if (!this.isConfigured()) {
      return 'AWS is not configured. Please configure your AWS credentials.';
    }
    if (!this.isOperational()) {
      return 'AWS connection failed. Please check your configuration.';
    }
    return '';
  }

  hasError(): boolean {
    return !!this.error;
  }

  clearError(): void {
    this.error = undefined;
  }

  // ==================== UTILITY ====================

  formatNumber(num: number | undefined): string {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  }

  getStatusSummary(): string {
    if (!this.statusData) return 'Loading...';
    
    if (!this.statusData.configured) {
      return 'AWS not configured';
    }
    
    if (!this.statusData.connected) {
      return 'AWS configured but not connected';
    }
    
    const parts: string[] = [];
    if (this.statusData.config?.name) {
      parts.push(this.statusData.config.name);
    }
    if (this.statusData.config?.region) {
      parts.push(this.getRegionLabel(this.statusData.config.region));
    }
    
    return parts.length > 0 ? parts.join(' - ') : 'AWS connected';
  }
}