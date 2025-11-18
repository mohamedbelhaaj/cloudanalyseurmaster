import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class UsersService {
 private apiUrl = environment.apiUrl;

 private api = 'http://127.0.0.1:8000/api/users';
   constructor(private http: HttpClient) {} // ← injection manquante


  private headers(): HttpHeaders {
    const token = localStorage.getItem('access_token') ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

    getAdmins(): Observable<User[]> {
    return this.http.get<User[]>(`${this.api}/admins/`, { headers: this.headers() });
  }
}