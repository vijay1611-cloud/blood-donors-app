import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { RequestService } from '../../core/api/request.service';
import { BloodRequest, UrgencyLevel } from '../../core/models/blood-request';
import { BLOOD_GROUPS, BloodGroup } from '../../core/models/blood-group';
import { CHENNAI_LOCALITIES, ChennaiLocality } from '../../core/models/localities';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-requests-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  template: `
    <div class="header">
      <h1>Blood requests</h1>
      @if (auth.isAdmin()) {
        <a mat-flat-button color="primary" routerLink="/requests/new">
          <mat-icon>add</mat-icon> New request
        </a>
      }
    </div>

    <form [formGroup]="filter" (ngSubmit)="search()" class="filter">
      <mat-slide-toggle formControlName="matching">Match my blood group + city</mat-slide-toggle>

      <mat-form-field appearance="outline">
        <mat-label>Blood group</mat-label>
        <mat-select formControlName="bloodGroup">
          <mat-option [value]="null">Any</mat-option>
          @for (g of groups; track g) {
            <mat-option [value]="g">{{ g }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Locality</mat-label>
        <mat-select formControlName="city">
          <mat-option [value]="null">Any</mat-option>
          @for (c of localities; track c) {
            <mat-option [value]="c">{{ c }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <button mat-flat-button color="primary" type="submit" [disabled]="loading()">Search</button>
    </form>

    @if (loading()) {
      <mat-spinner diameter="32" />
    } @else if (results().length === 0) {
      <mat-card class="empty">
        <p>No open requests match those filters.</p>
      </mat-card>
    } @else {
      <div class="grid">
        @for (r of results(); track r._id) {
          <a class="card-link" [routerLink]="['/requests', r._id]">
            <mat-card class="req-card" [class]="'urgency-' + r.urgency">
              <div class="row">
                <div>
                  <h3>{{ r.hospitalName }}</h3>
                  <p class="muted">{{ r.city }}</p>
                </div>
                <span class="bg-chip">{{ r.bloodGroup }}</span>
              </div>
              <div class="row">
                <span class="urgency">{{ urgencyLabel(r.urgency) }}</span>
                <span class="units">{{ r.unitsNeeded }} unit{{ r.unitsNeeded > 1 ? 's' : '' }}</span>
              </div>
              @if (r.neededBy) {
                <p class="needed-by">Needed by {{ r.neededBy | date:'mediumDate' }}</p>
              }
              @if (r.hasResponded) {
                <p class="responded-badge">
                  <mat-icon>check_circle</mat-icon> You responded
                </p>
              }
            </mat-card>
          </a>
        }
      </div>
    }
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    h1 { margin: 0; }
    .filter { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .filter mat-form-field { min-width: 180px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .card-link { text-decoration: none; color: inherit; }
    .req-card { padding: 16px; border-left: 4px solid transparent; }
    .urgency-critical { border-left-color: #c62828; }
    .urgency-high { border-left-color: #ef6c00; }
    .urgency-normal { border-left-color: #1976d2; }
    .urgency-low { border-left-color: #9e9e9e; }
    .row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    h3 { margin: 0; }
    .muted { color: #666; margin: 4px 0 0; font-size: 14px; }
    .bg-chip { background: #c62828; color: white; padding: 4px 12px; border-radius: 999px; font-weight: 600; font-size: 14px; }
    .urgency { font-weight: 500; }
    .urgency-critical .urgency { color: #c62828; }
    .urgency-high .urgency { color: #ef6c00; }
    .units { color: #666; }
    .needed-by { margin: 4px 0 0; font-size: 13px; color: #666; }
    .responded-badge {
      margin: 8px 0 0;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #2e7d32;
      font-weight: 500;
    }
    .responded-badge mat-icon { font-size: 16px; height: 16px; width: 16px; }
    .empty { padding: 24px; text-align: center; }
  `],
})
export class RequestsListComponent {
  private fb = inject(FormBuilder);
  private requests = inject(RequestService);
  auth = inject(AuthService);

  groups = BLOOD_GROUPS;
  localities = CHENNAI_LOCALITIES;
  results = signal<BloodRequest[]>([]);
  loading = signal(false);

  filter = this.fb.nonNullable.group({
    matching: [false],
    bloodGroup: [null as BloodGroup | null],
    city: [null as ChennaiLocality | null],
  });

  constructor() {
    this.search();
  }

  search() {
    this.loading.set(true);
    const { matching, bloodGroup, city } = this.filter.getRawValue();
    this.requests.list({
      matching,
      bloodGroup: matching ? undefined : bloodGroup ?? undefined,
      city: matching ? undefined : city ?? undefined,
    }).subscribe({
      next: (rows) => {
        this.results.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  urgencyLabel(u: UrgencyLevel): string {
    return u.charAt(0).toUpperCase() + u.slice(1);
  }
}
