import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BloodRequest,
  BloodRequestInput,
  RequestStatus,
  Responder,
} from '../models/blood-request';
import { BloodGroup } from '../models/blood-group';

export interface RequestFilter {
  bloodGroup?: BloodGroup;
  city?: string;
  status?: RequestStatus;
  matching?: boolean;
}

@Injectable({ providedIn: 'root' })
export class RequestService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/requests`;

  list(filter: RequestFilter = {}): Observable<BloodRequest[]> {
    let params = new HttpParams();
    if (filter.matching) params = params.set('matching', '1');
    if (filter.bloodGroup) params = params.set('bloodGroup', filter.bloodGroup);
    if (filter.city) params = params.set('city', filter.city);
    if (filter.status) params = params.set('status', filter.status);
    return this.http.get<BloodRequest[]>(this.base, { params });
  }

  get(id: string): Observable<BloodRequest> {
    return this.http.get<BloodRequest>(`${this.base}/${id}`);
  }

  create(input: BloodRequestInput): Observable<BloodRequest> {
    return this.http.post<BloodRequest>(this.base, input);
  }

  updateStatus(id: string, status: RequestStatus): Observable<BloodRequest> {
    return this.http.patch<BloodRequest>(`${this.base}/${id}`, { status });
  }

  respond(id: string, note?: string): Observable<unknown> {
    return this.http.post(`${this.base}/${id}/respond`, { note: note ?? '' });
  }

  responders(id: string): Observable<Responder[]> {
    return this.http.get<Responder[]>(`${this.base}/${id}/responders`);
  }

  notifications(id: string): Observable<NotificationSummary> {
    return this.http.get<NotificationSummary>(`${this.base}/${id}/notifications`);
  }

  approve(id: string): Observable<BloodRequest> {
    return this.http.post<BloodRequest>(`${this.base}/${id}/approve`, {});
  }

  reject(id: string): Observable<BloodRequest> {
    return this.http.post<BloodRequest>(`${this.base}/${id}/reject`, {});
  }

  submitPublic(input: BloodRequestInput): Observable<{ id: string; status: string; message: string }> {
    return this.http.post<{ id: string; status: string; message: string }>(
      `${environment.apiBaseUrl}/public/requests`,
      input,
    );
  }
}

export interface NotificationLogItem {
  donorUid: string;
  channel: string;
  status: 'sent' | 'failed' | 'skipped';
  error: string;
  sentAt: string;
}

export interface NotificationSummary {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  items: NotificationLogItem[];
}
