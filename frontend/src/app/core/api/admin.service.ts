import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastSignInAt: string;
}

export interface AdminGrantResult {
  uid: string;
  email: string;
  admin: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/admin`;

  listAdmins(): Observable<{ admins: AdminUser[] }> {
    return this.http.get<{ admins: AdminUser[] }>(`${this.base}/users`);
  }

  grant(email: string): Observable<AdminGrantResult> {
    return this.http.post<AdminGrantResult>(`${this.base}/users/grant`, { email });
  }

  revoke(email: string): Observable<AdminGrantResult> {
    return this.http.post<AdminGrantResult>(`${this.base}/users/revoke`, { email });
  }
}
