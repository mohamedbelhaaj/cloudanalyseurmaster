import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {  MitigationActionResponse } from '@core/models/mitigations.model';
import { MigrationsService } from '@core/services/migrations.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
@Component({
  selector: 'app-migrations-table',
standalone: true,
  imports: [CommonModule, RouterModule,ReactiveFormsModule],  templateUrl: './migrations-table.component.html',
  styleUrls: ['./migrations-table.component.scss']
})
export class MigrationsTableComponent implements OnInit {
 @Input() reportId: string = ''; // Remplis depuis le parent si contexte rapport
  mitigationForm: FormGroup;
  mitigationResult: MitigationActionResponse | null = null;
  loading: boolean = false;
  error: string | null = null;

  actionOptions = [
    { value: 'block_ip', label: 'Bloquer IP' },
    { value: 'block_domain', label: 'Bloquer Domaine' },
    { value: 'quarantine', label: 'Quarantaine Fichier' },
    { value: 'alert', label: 'Envoyer Alerte' },
    { value: 'investigate', label: 'Investigation supplémentaire' }
  ];

  awsRegions = ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1'];

  constructor(
    private fb: FormBuilder,
    private migrationsService: MigrationsService
  ) {
    this.mitigationForm = this.fb.group({
      action_type: ['', Validators.required],
      target_value: ['', Validators.required],
      aws_region: ['us-east-1', Validators.required],
      description: ['', Validators.required],
      execute_now: [false]
    });
  }
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

  submit() {
    this.loading = true;
    this.error = null;
    const payload = { ...this.mitigationForm.value, report: this.reportId };
    this.migrationsService.createMitigation(payload).subscribe({
      next: res => {
        this.mitigationResult = res;
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.error || 'Erreur du serveur';
        this.loading = false;
      }
    });
  }
}
