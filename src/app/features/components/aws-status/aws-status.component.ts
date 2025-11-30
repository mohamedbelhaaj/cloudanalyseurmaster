import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  AWSConfigurationService,
  AWSStatusResponse
} from '@core/services/awsconfiguration.service';

@Component({
  selector: 'app-aws-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aws-status.component.html',
  styleUrls: ['./aws-status.component.scss']
})
export class AwsStatusComponent implements OnInit, OnDestroy {
  statusData: AWSStatusResponse | null = null;
  loading = false;
  error = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private awsConfigService: AWSConfigurationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('📊 AWS Status Component Loaded');
    this.loadStatus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStatus(): void {
    this.loading = true;
    this.error = '';
    
    this.awsConfigService.getAWSStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status) => {
          console.log('✅ Status loaded:', status);
          this.statusData = status;
          this.loading = false;
        },
        error: (err) => {
          console.error('❌ Status load error:', err);
          this.error = 'Failed to load AWS status';
          this.loading = false;
        }
      });
  }

  refreshStatus(): void {
    console.log('🔄 Refreshing status...');
    this.loadStatus();
  }

  navigateToConfig(): void {
    this.router.navigate(['/awsconf']);
  }

  getConnectionStatusClass(): string {
    if (!this.statusData) return 'status-unknown';
    if (!this.statusData.configured) return 'status-warning';
    if (!this.statusData.connected) return 'status-error';
    return 'status-success';
  }

  getConnectionStatusText(): string {
    if (!this.statusData) return 'Loading...';
    if (!this.statusData.configured) return 'Not Configured';
    if (!this.statusData.connected) return 'Disconnected';
    return 'Connected';
  }

  getRegionLabel(region: string): string {
    return this.awsConfigService.getRegionLabel(region);
  }

  getConfiguredFeaturesCount(): number {
    if (!this.statusData?.config) return 0;
    
    let count = 0;
    if (this.statusData.config.vpc_id) count++;
    if (this.statusData.config.security_group_id) count++;
    if (this.statusData.config.waf_configured) count++;
    if (this.statusData.config.nacl_configured) count++;
    if (this.statusData.config.firewall_configured) count++;
    
    return count;
  }

  getTotalFeatures(): number {
    return 5; // VPC, SG, WAF, NACL, Firewall
  }
}