import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {  MitigationActionResponse } from '@core/models/mitigations.model';
import { environment } from '../../../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class MigrationsService {
 private apiUrl =  'http://127.0.0.1:8000/api/mitigations';

  constructor(private http: HttpClient) {}

    createMitigation(data: any): Observable<MitigationActionResponse> {
    return this.http.post<MitigationActionResponse>(this.apiUrl, data);
  }
}