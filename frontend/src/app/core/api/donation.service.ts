import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Donation, DonationInput } from '../models/donation';

@Injectable({ providedIn: 'root' })
export class DonationService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/donations`;

  list(): Observable<Donation[]> {
    return this.http.get<Donation[]>(this.base);
  }

  create(input: DonationInput): Observable<Donation> {
    return this.http.post<Donation>(this.base, input);
  }
}
