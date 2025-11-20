import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SendToAdminRequest, SendToAdminResponse } from '../../core/models/sendtoadmin';
@Injectable({
  providedIn: 'root'
})
export class SendToAdminService {

 private baseUrl = 'http://localhost:8000/api/reportsNaN/send_to_admin/';

  constructor(private http: HttpClient) {}

  sendToAdmin(reportId: number, data: SendToAdminRequest): Observable<SendToAdminResponse> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<SendToAdminResponse>(
      `${this.baseUrl}${reportId}/send_to_admin/`,
      data,
      { headers }
    ).pipe(
      catchError(err => throwError(() => err))
    );
  }
}