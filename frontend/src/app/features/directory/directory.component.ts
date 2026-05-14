import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DonorService } from '../../core/api/donor.service';
import { BLOOD_GROUPS, BloodGroup } from '../../core/models/blood-group';
import { CHENNAI_LOCALITIES, ChennaiLocality } from '../../core/models/localities';
import { Donor } from '../../core/models/donor';
import { EligibilityBadgeComponent } from '../../shared/eligibility-badge.component';

@Component({
  selector: 'app-directory',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    EligibilityBadgeComponent,
  ],
  template: `
    <h1>Donor directory</h1>

    <form [formGroup]="filter" (ngSubmit)="search()" class="filter">
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
      <p class="muted">No donors match those filters.</p>
    } @else {
      <div class="grid">
        @for (d of results(); track d.firebaseUid) {
          <mat-card class="donor-card">
            <div class="row">
              <div>
                <h3>{{ d.firstName }} {{ d.lastName }}</h3>
                <p class="muted">{{ d.city || '—' }}</p>
              </div>
              <span class="bg-chip">{{ d.bloodGroup }}</span>
            </div>
            <div class="row">
              <app-eligibility-badge [eligibility]="d.eligibility" />
              @if (d.phone) {
                <a class="phone" [href]="'tel:' + d.phone">{{ d.phone }}</a>
              }
            </div>
          </mat-card>
        }
      </div>
    }
  `,
  styles: [`
    h1 { margin: 0 0 16px; }
    .filter { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .filter mat-form-field { min-width: 180px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .donor-card { padding: 16px; }
    .row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    h3 { margin: 0; }
    .muted { color: #666; margin: 4px 0 0; font-size: 14px; }
    .bg-chip { background: #c62828; color: white; padding: 4px 12px; border-radius: 999px; font-weight: 600; font-size: 14px; }
    .phone { color: #1976d2; text-decoration: none; font-size: 14px; }
  `],
})
export class DirectoryComponent {
  private fb = inject(FormBuilder);
  private donors = inject(DonorService);

  groups = BLOOD_GROUPS;
  localities = CHENNAI_LOCALITIES;
  results = signal<Donor[]>([]);
  loading = signal(false);

  filter = this.fb.nonNullable.group({
    bloodGroup: [null as BloodGroup | null],
    city: [null as ChennaiLocality | null],
  });

  constructor() {
    this.search();
  }

  search() {
    this.loading.set(true);
    const { bloodGroup, city } = this.filter.getRawValue();
    this.donors.list({
      bloodGroup: bloodGroup ?? undefined,
      city: city ?? undefined,
    }).subscribe({
      next: (rows) => {
        this.results.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
