import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
   stats = [
    { label: 'Pending Reports', icon: '⛔', border: 'pending' },
    { label: 'Critical Threats', icon: '⛔', border: 'critical' },
    { label: 'Open Tasks', icon: '1', border: 'open-tasks' },
    { label: 'Blocked IPs', icon: '⛔', border: 'blocked' }
  ];

  recentThreats = [
    {
      type: 'domain',
      indicator: 'www.facebook.com',
      severity: 'INFO',
      analyst: 'analyst',
      actionText: 'View Details'
    }
    // Ajoute d'autres objets ici selon tes besoins
  ];
}