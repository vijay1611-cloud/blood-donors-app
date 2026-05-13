import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DonorService } from '../../core/api/donor.service';
import { BLOOD_GROUPS, BloodGroup } from '../../core/models/blood-group';
import { Donor } from '../../core/models/donor';
import { EligibilityBadgeComponent } from '../../shared/eligibility-badge.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    EligibilityBadgeComponent,
  ],
  template: `
    <h1>Your donor profile</h1>

    @if (loading()) {
      <mat-spinner diameter="32" />
    } @else if (donor()) {
      <mat-card>
        <div class="header">
          <h2>{{ displayName() }}</h2>
          <app-eligibility-badge [eligibility]="donor()!.eligibility" />
        </div>

        <form [formGroup]="form" (ngSubmit)="save()" class="grid">
          <mat-form-field appearance="outline">
            <mat-label>First name</mat-label>
            <input matInput formControlName="firstName" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Last name</mat-label>
            <input matInput formControlName="lastName" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Blood group</mat-label>
            <mat-select formControlName="bloodGroup">
              @for (g of groups; track g) {
                <mat-option [value]="g">{{ g }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Phone</mat-label>
            <input matInput formControlName="phone" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="span-2">
            <mat-label>City</mat-label>
            <input matInput formControlName="city" />
          </mat-form-field>

          <div class="span-2 toggle">
            <mat-slide-toggle formControlName="willingToDonate">
              I'm currently willing to donate
            </mat-slide-toggle>
          </div>

          <div class="span-2 actions">
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
              {{ saving() ? 'Saving…' : 'Save profile' }}
            </button>
          </div>
        </form>
      </mat-card>
    }
  `,
  styles: [`
    h1 { margin: 0 0 16px; }
    .header { display: flex; align-items: center; justify-content: space-between; padding: 16px 16px 0; }
    h2 { margin: 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px; }
    .span-2 { grid-column: span 2; }
    .toggle { padding: 4px 0; }
    .actions { display: flex; justify-content: flex-end; }
    @media (max-width: 600px) {
      .grid { grid-template-columns: 1fr; }
      .span-2 { grid-column: span 1; }
    }
  `],
})
export class ProfileComponent {
  private fb = inject(FormBuilder);
  private donors = inject(DonorService);
  private snack = inject(MatSnackBar);

  groups = BLOOD_GROUPS;
  donor = signal<Donor | null>(null);
  loading = signal(true);
  saving = signal(false);

  form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: [''],
    bloodGroup: [null as BloodGroup | null, Validators.required],
    phone: [''],
    city: ['', Validators.required],
    willingToDonate: [true],
  });

  constructor() {
    this.donors.getMe().subscribe({
      next: (d) => {
        this.donor.set(d);
        this.form.patchValue({
          firstName: d.firstName ?? '',
          lastName: d.lastName ?? '',
          bloodGroup: d.bloodGroup,
          phone: d.phone ?? '',
          city: d.city ?? '',
          willingToDonate: d.willingToDonate ?? true,
        });
        this.loading.set(false);
      },
      error: () => {
        this.snack.open('Could not load profile', 'Dismiss', { duration: 4000 });
        this.loading.set(false);
      },
    });
  }

  displayName(): string {
    const d = this.donor();
    if (!d) return '';
    const name = `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim();
    return name || 'New donor';
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.donors.updateMe(this.form.getRawValue()).subscribe({
      next: (d) => {
        this.donor.set(d);
        this.saving.set(false);
        this.snack.open('Profile saved', 'OK', { duration: 2000 });
      },
      error: () => {
        this.saving.set(false);
        this.snack.open('Could not save profile', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
