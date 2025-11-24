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
  error: string | undefined = undefined; // << Fix here

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

  /** Charge le statut AWS */
  loadStatus(silent: boolean = false): void {
    if (!silent) {
      this.loading = true;
    }
    this.error = undefined; // << Fix (use undefined, not null)

    this.awsConfigService.getAWSStatus().subscribe({
      next: (data) => {
        this.statusData = data;
        this.loading = false;
        console.log('AWS Status loaded:', data);
      },
      error: (error) => {
        console.error('Error loading AWS status:', error);
        this.error = error.message || 'Failed to load AWS status';
        this.loading = false;

        // Créer un statut par défaut en cas d'erreur
        this.statusData = {
          configured: false,
          connected: false,
          message: this.error
        };
      }
    });
  }

  /** Rafraîchit le statut (appelé manuellement) */
  refreshStatus(): void {
    this.loadStatus();
  }

  /** Force une vérification complète du statut */
  forceRefresh(): void {
    this.loading = true;
    this.awsConfigService.refreshAWSStatus().subscribe({
      next: (data) => {
        this.statusData = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error forcing refresh:', error);
        this.error = error.message;
        this.loading = false;
      }
    });
  }

  // ==================== AUTO REFRESH ====================

  /** Démarre le rafraîchissement automatique */
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
          next: (data) => {
            this.statusData = data;
            this.loading = false;
          },
          error: (error) => {
            console.error('Auto-refresh error:', error);
          }
        });
    }
  }

  /** Arrête le rafraîchissement automatique */
  stopAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = undefined;
    }
  }

  /** Active/désactive le rafraîchissement automatique */
  toggleAutoRefresh(): void {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    if (this.autoRefreshEnabled) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  // ==================== NAVIGATION ====================

  /** Navigue vers la page de configuration */
  navigateToConfig(): void {
    this.router.navigate(['/awsconf']);
  }

  /** Navigue vers une ressource spécifique */
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

  getTimeSinceLastUpdate(): string {
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

  // ==================== SECURITY HELPERS ====================

  isAutoBlockEnabled(): boolean {
    return this.statusData?.config?.auto_block_enabled || false;
  }

  getAutoBlockThreshold(): number {
    return this.statusData?.config?.auto_block_threshold || 0;
  }

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
    const dataStr = JSON.stringify(this.statusData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aws-status-${new Date().toISOString()}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  copyStatusToClipboard(): void {
    const statusText = JSON.stringify(this.statusData, null, 2);
    navigator.clipboard.writeText(statusText).then(() => {
      console.log('Status copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy status:', err);
    });
  }
}
