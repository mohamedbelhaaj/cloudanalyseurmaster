import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyzeComponent } from "@features/analyze/analyze.component";
import { NavbarComponent } from "@shared/layout/navbar/navbar.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  stats = [
    {
      title: 'Total Analyses',
      value: '1,247',
      icon: '🔍',
      change: '+12%',
      isPositive: true,
      period: 'vs last month'
    },
    {
      title: 'Threats Detected',
      value: '89',
      icon: '⚠️',
      change: '-8%',
      isPositive: false,
      period: 'vs last month'
    },
    {
      title: 'Clean Results',
      value: '1,158',
      icon: '✅',
      change: '+15%',
      isPositive: true,
      period: 'vs last month'
    }
  ];

  features = [
    {
      icon: '🌐',
      title: 'IP Address Analysis',
      description: 'Check IP addresses for malicious activity and reputation',
      badge: 'Real-time'
    },
    {
      icon: '🔗',
      title: 'URL Scanning',
      description: 'Scan URLs for phishing, malware, and security threats',
      badge: 'Instant'
    },
    {
      icon: '🏢',
      title: 'Domain Lookup',
      description: 'Investigate domain reputation and historical data',
      badge: 'Comprehensive'
    },
    {
      icon: '🔐',
      title: 'File Hash Check',
      description: 'Verify file integrity using MD5, SHA-1, or SHA-256 hashes',
      badge: 'Secure'
    },
    {
      icon: '📁',
      title: 'File Upload',
      description: 'Upload files directly for comprehensive malware analysis',
      badge: 'Advanced'
    },
    {
      icon: '⚡',
      title: 'Real-time Results',
      description: 'Get instant threat intelligence from multiple sources',
      badge: 'Fast'
    }
  ];
recentThreats: any;
}