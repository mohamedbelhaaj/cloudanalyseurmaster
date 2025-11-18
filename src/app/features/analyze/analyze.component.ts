import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AnalysisResult } from '../../core/models/analysis.model';
import { AnalyzeService } from '../../core/services/analyze.service';

@Component({
  selector: 'app-analyze',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './analyze.component.html',
  styleUrls: ['./analyze.component.scss'] // ✅ correction 1
})
export class AnalyzeComponent implements OnInit { // ✅ correction 2

   inputValue = '';
  engineChoice: 'vt' | 'otx' = 'vt';
  selectedFile: File | null = null;
  loading = false;
  result: AnalysisResult | null = null;
  recentReports: AnalysisResult[] = [];

  // Messages utilisateur
  error = '';
  success = '';

  // Getters pour éviter localStorage dans le template
  get username(): string {
    return localStorage.getItem('username') ?? 'User';
  }
  get role(): string {
    return localStorage.getItem('role') ?? 'analyst';
  }

  constructor(private analyzeService: AnalyzeService) {}

  ngOnInit(): void {
    // On pourra ré-activer listRecent() quand la route Django existera
    this.recentReports = [];
  }

  ngAfterViewInit(): void {
    this.initAnimations();
  }

  /* ---------- Gestion fichier ---------- */
  onFileSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] || null;
    this.selectedFile = file;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.selectedFile = file;
    (event.target as HTMLElement).classList.remove('dragover');
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    (event.target as HTMLElement).classList.add('dragover');
  }

  onDragLeave(event: DragEvent): void {
    (event.target as HTMLElement).classList.remove('dragover');
  }

  /* ---------- Analyse ---------- */
  analyze(): void {
    this.error = '';
    this.success = '';

    if (!this.inputValue.trim() && !this.selectedFile) {
      this.error = 'Veuillez entrer une valeur ou sélectionner un fichier.';
      return;
    }

    this.loading = true;
    this.result = null;

    const obs = this.selectedFile
      ? this.analyzeService.analyzeFile(this.selectedFile, this.engineChoice)
      : this.analyzeService.analyzeText(this.inputValue, this.engineChoice);

    obs.subscribe({
      next: (res: AnalysisResult) => {
        this.result = res;
        this.recentReports = [res, ...this.recentReports];
        this.success = 'Analyse terminée avec succès.';
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.error || 'Erreur inattendue.';
        this.loading = false;
      }
    });
  }

  /* ---------- UI ---------- */
  badgeSeverity(s: string): string {
    return `badge--${s}`;
  }

  /* ---------- Animations ---------- */
  initAnimations(): void {
    const btn = document.querySelector('.btn') as HTMLElement;
    if (!btn) return;

    btn.addEventListener('click', (e: Event) => {
      const ripple = document.createElement('span');
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = (e as MouseEvent).clientX - rect.left - size / 2;
      const y = (e as MouseEvent).clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.classList.add('ripple');
      btn.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });

    // Cartes
    const cards = document.querySelectorAll<HTMLElement>('.stat-card');
    cards.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      setTimeout(() => {
        card.style.transition = 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 150 * i);
    });
  }
}