import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Donor, DonorUpdate } from '../models/donor';
import { BloodGroup } from '../models/blood-group';

export interface DonorFilter {
  bloodGroup?: BloodGroup;
  city?: string;
}

@Injectable({ providedIn: 'root' })
export class DonorService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/donors`;

  getMe(): Observable<Donor> {
    return this.http.get<Donor>(`${this.base}/me`);
  }

  updateMe(update: DonorUpdate): Observable<Donor> {
    return this.http.put<Donor>(`${this.base}/me`, update);
  }

  list(filter: DonorFilter = {}): Observable<Donor[]> {
    let params = new HttpParams();
    if (filter.bloodGroup) params = params.set('bloodGroup', filter.bloodGroup);
    if (filter.city) params = params.set('city', filter.city);
    return this.http.get<Donor[]>(this.base, { params });
  }
}
