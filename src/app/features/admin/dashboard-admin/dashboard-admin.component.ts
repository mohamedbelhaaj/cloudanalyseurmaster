import { CommonModule } from '@angular/common';
import { Component, OnInit , OnDestroy} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { DashboardService } from '@core/services/dashboard.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chart } from 'chart.js/auto';
interface DashboardStats {
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
  top_threats: any[];
  recent_critical: any[];
}

interface AWSStatus {
  vpc_status: string;
  security_groups: any[];
  active_configurations: number;
  region: string;
  last_sync: string;
}
@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './dashboard-admin.component.html',
  styleUrl: './dashboard-admin.component.scss'
})
export class DashboardAdminComponent  implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  dashboardStats: DashboardStats | null = null;
  awsStatus: AWSStatus | null = null;
  loading = true;
  error: string | null = null;
  
  // Charts
  severityChart: Chart | null = null;
  statusChart: Chart | null = null;
  trendsChart: Chart | null = null;
  
  // Refresh interval
  private refreshInterval: any;
  autoRefresh = true;
  lastUpdated: Date = new Date();

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Vérifier que l'utilisateur est admin
    if (!this.authService.isAdmin()) {
      console.error('❌ Access denied: user is not admin');
      this.error = 'Access denied. You must be an administrator.';
      setTimeout(() => this.router.navigate(['/dashboard']), 2000);
      return;
    }

    console.log('🔍 Current user:', this.authService.getCurrentUserValue());
    console.log('🔑 Access token:', this.authService.getAccessToken()?.substring(0, 20) + '...');

    this.loadDashboard();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopAutoRefresh();
    this.destroyCharts();
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = null;

    console.log('📊 Loading dashboard data...');

    // Load dashboard stats
    this.dashboardService.getDashboardStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('✅ Dashboard stats loaded:', data);
          this.dashboardStats = data;
          this.lastUpdated = new Date();
          this.loading = false;
          
          // Initialize charts after DOM is ready
          setTimeout(() => this.initializeCharts(), 100);
        },
        error: (err) => {
          console.error('❌ Failed to load dashboard stats:', err);
          
          if (err.status === 403) {
            this.error = 'Access forbidden. Administrator permissions required.';
            
            // Vérifier si l'utilisateur est vraiment admin
            const user = this.authService.getCurrentUserValue();
            if (user && user.role !== 'admin') {
              setTimeout(() => this.router.navigate(['/dashboard']), 2000);
            }
          } else if (err.status === 401) {
            this.error = 'Session expired. Please login again.';
            setTimeout(() => {
              this.authService.logout().subscribe();
              this.router.navigate(['/login']);
            }, 2000);
          } else {
            this.error = err.message || 'Failed to load dashboard statistics';
          }
          
          this.loading = false;
        }
      });

    // Load AWS status (optional, non-blocking)
    this.dashboardService.getAWSStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('✅ AWS status loaded:', data);
          this.awsStatus = data;
        },
        error: (err) => {
          console.warn('⚠️ Failed to load AWS status:', err);
          // AWS status is optional, so we don't show error to user
        }
      });
  }

  initializeCharts(): void {
    if (!this.dashboardStats) {
      console.warn('⚠️ Cannot initialize charts: no dashboard stats');
      return;
    }

    console.log('📊 Initializing charts...');
    this.destroyCharts();

    // Severity Distribution Chart
    const severityCtx = document.getElementById('severityChart') as HTMLCanvasElement;
    if (severityCtx) {
      const severityData = this.dashboardStats.severity_distribution;
      const labels = Object.keys(severityData);
      const values = Object.values(severityData);
      
      if (labels.length > 0) {
        this.severityChart = new Chart(severityCtx, {
          type: 'doughnut',
          data: {
            labels: labels.map(k => k.toUpperCase()),
            datasets: [{
              data: values,
              backgroundColor: [
                '#ef4444', // critical - red
                '#f59e0b', // high - orange
                '#eab308', // medium - yellow
                '#22c55e', // low - green
                '#3b82f6'  // info - blue
              ],
              borderWidth: 2,
              borderColor: '#1f2937'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { color: '#e5e7eb', font: { size: 12 } }
              },
              title: {
                display: true,
                text: 'Severity Distribution',
                color: '#f9fafb',
                font: { size: 16, weight: 'bold' }
              }
            }
          }
        });
        console.log('✅ Severity chart initialized');
      }
    }

    // Status Distribution Chart
    const statusCtx = document.getElementById('statusChart') as HTMLCanvasElement;
    if (statusCtx) {
      const statusData = this.dashboardStats.status_distribution;
      const labels = Object.keys(statusData);
      const values = Object.values(statusData);
      
      if (labels.length > 0) {
        this.statusChart = new Chart(statusCtx, {
          type: 'bar',
          data: {
            labels: labels.map(k => k.replace('_', ' ').toUpperCase()),
            datasets: [{
              label: 'Reports',
              data: values,
              backgroundColor: '#3b82f6',
              borderColor: '#2563eb',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: {
                display: true,
                text: 'Status Distribution',
                color: '#f9fafb',
                font: { size: 16, weight: 'bold' }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { color: '#e5e7eb' },
                grid: { color: '#374151' }
              },
              x: {
                ticks: { color: '#e5e7eb' },
                grid: { color: '#374151' }
              }
            }
          }
        });
        console.log('✅ Status chart initialized');
      }
    }

    // Trends Chart
    const trendsCtx = document.getElementById('trendsChart') as HTMLCanvasElement;
    if (trendsCtx) {
      const trends = this.dashboardStats.trends;
      this.trendsChart = new Chart(trendsCtx, {
        type: 'line',
        data: {
          labels: ['Today', 'This Week', 'This Month'],
          datasets: [{
            label: 'Reports',
            data: [trends.today, trends.this_week, trends.this_month],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: 'Report Trends',
              color: '#f9fafb',
              font: { size: 16, weight: 'bold' }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: '#e5e7eb' },
              grid: { color: '#374151' }
            },
            x: {
              ticks: { color: '#e5e7eb' },
              grid: { color: '#374151' }
            }
          }
        }
      });
      console.log('✅ Trends chart initialized');
    }
  }

  destroyCharts(): void {
    if (this.severityChart) {
      this.severityChart.destroy();
      this.severityChart = null;
    }
    if (this.statusChart) {
      this.statusChart.destroy();
      this.statusChart = null;
    }
    if (this.trendsChart) {
      this.trendsChart.destroy();
      this.trendsChart = null;
    }
  }

  startAutoRefresh(): void {
    if (this.autoRefresh) {
      this.refreshInterval = setInterval(() => {
        console.log('🔄 Auto-refreshing dashboard...');
        this.loadDashboard();
      }, 30000); // Refresh every 30 seconds
    }
  }

  stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    console.log('🔄 Auto-refresh:', this.autoRefresh ? 'ON' : 'OFF');
    
    if (this.autoRefresh) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  refresh(): void {
    console.log('🔄 Manual refresh triggered');
    this.loadDashboard();
  }

  getSeverityBadgeClass(severity: string): string {
    const classes: { [key: string]: string } = {
      critical: 'badge-critical',
      high: 'badge-high',
      medium: 'badge-medium',
      low: 'badge-low',
      info: 'badge-info'
    };
    return classes[severity.toLowerCase()] || 'badge-info';
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      pending: 'badge-warning',
      in_progress: 'badge-info',
      investigating: 'badge-info',
      mitigated: 'badge-success',
      resolved: 'badge-success',
      closed: 'badge-secondary'
    };
    return classes[status.toLowerCase()] || 'badge-secondary';
  }

  getAWSStatusClass(): string {
    if (!this.awsStatus) return 'status-unknown';
    return this.awsStatus.vpc_status === 'active' ? 'status-active' : 'status-inactive';
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  }
}