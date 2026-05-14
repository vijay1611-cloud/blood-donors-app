import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { RequestService } from '../../core/api/request.service';
import { BLOOD_GROUPS, BloodGroup } from '../../core/models/blood-group';
import { CHENNAI_LOCALITIES, ChennaiLocality } from '../../core/models/localities';
import { URGENCY_LEVELS, UrgencyLevel, BloodRequestInput } from '../../core/models/blood-request';

@Component({
  selector: 'app-emergency',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatIconModule,
  ],
  template: `
    <div class="page">
      <header>
        <h1>🩸 Emergency blood request</h1>
        <p class="muted">
          Submit a request without signing up. An administrator will review and approve it.
          Once approved, matching donors near you will be notified by email.
        </p>
      </header>

      @if (submitted()) {
        <mat-card class="success">
          <mat-icon class="check">check_circle</mat-icon>
          <h2>Request submitted</h2>
          <p>{{ submittedMessage() }}</p>
          <div class="actions">
            <button mat-stroked-button (click)="reset()">Submit another</button>
            <a mat-flat-button color="primary" routerLink="/login">Back to login</a>
          </div>
        </mat-card>
      } @else {
        <mat-card>
          <form [formGroup]="form" (ngSubmit)="submit()" class="grid">
            <mat-form-field appearance="outline">
              <mat-label>Blood group</mat-label>
              <mat-select formControlName="bloodGroup">
                @for (g of groups; track g) { <mat-option [value]="g">{{ g }}</mat-option> }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Units needed</mat-label>
              <input matInput type="number" min="1" max="50" formControlName="unitsNeeded" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Urgency</mat-label>
              <mat-select formControlName="urgency">
                @for (u of urgencies; track u) {
                  <mat-option [value]="u">{{ urgencyLabel(u) }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Needed by (optional)</mat-label>
              <input matInput [matDatepicker]="picker" [min]="today" formControlName="neededBy" />
              <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline" class="span-2">
              <mat-label>Hospital / location name</mat-label>
              <input matInput formControlName="hospitalName" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Locality (Chennai)</mat-label>
              <mat-select formControlName="city">
                @for (c of localities; track c) { <mat-option [value]="c">{{ c }}</mat-option> }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Your name</mat-label>
              <input matInput formControlName="contactName" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="span-2">
              <mat-label>Your phone number</mat-label>
              <input matInput type="tel" formControlName="contactPhone" placeholder="+91…" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="span-2">
              <mat-label>Notes (optional)</mat-label>
              <textarea matInput formControlName="notes" rows="3"
                placeholder="Patient condition, hospital ward, anything that helps donors decide…"></textarea>
            </mat-form-field>

            @if (error()) {
              <p class="error span-2">{{ error() }}</p>
            }

            <div class="span-2 actions">
              <a mat-button routerLink="/login">Cancel</a>
              <button mat-flat-button color="primary" type="submit"
                [disabled]="form.invalid || saving()">
                {{ saving() ? 'Submitting…' : 'Submit request' }}
              </button>
            </div>
          </form>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 720px; margin: 0 auto; padding: 24px 16px; }
    header { margin-bottom: 16px; }
    h1 { margin: 0 0 8px; }
    .muted { color: #666; margin: 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px; }
    .span-2 { grid-column: span 2; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; }
    .error { color: #c62828; margin: 0; padding: 0 16px; }
    .success { padding: 32px; text-align: center; }
    .success .check { font-size: 56px; height: 56px; width: 56px; color: #2e7d32; margin-bottom: 8px; }
    .success h2 { margin: 0 0 12px; }
    .success .actions { justify-content: center; margin-top: 16px; }
    @media (max-width: 600px) {
      .grid { grid-template-columns: 1fr; }
      .span-2 { grid-column: span 1; }
    }
  `],
})
export class EmergencyComponent {
  private fb = inject(FormBuilder);
  private requests = inject(RequestService);

  groups = BLOOD_GROUPS;
  urgencies = URGENCY_LEVELS;
  localities = CHENNAI_LOCALITIES;
  today = new Date();

  saving = signal(false);
  submitted = signal(false);
  submittedMessage = signal('');
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    bloodGroup: [null as BloodGroup | null, Validators.required],
    unitsNeeded: [1, [Validators.required, Validators.min(1), Validators.max(50)]],
    urgency: ['high' as UrgencyLevel, Validators.required],
    hospitalName: ['', Validators.required],
    city: [null as ChennaiLocality | null, Validators.required],
    contactName: ['', Validators.required],
    contactPhone: ['', [Validators.required, Validators.minLength(6)]],
    neededBy: [null as Date | null],
    notes: [''],
  });

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    const payload: BloodRequestInput = {
      bloodGroup: v.bloodGroup as BloodGroup,
      unitsNeeded: v.unitsNeeded,
      urgency: v.urgency,
      hospitalName: v.hospitalName.trim(),
      city: v.city as ChennaiLocality,
      contactName: v.contactName.trim(),
      contactPhone: v.contactPhone.trim(),
      neededBy: v.neededBy ? v.neededBy.toISOString() : null,
      notes: v.notes.trim(),
    };

    this.requests.submitPublic(payload).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.submittedMessage.set(res.message);
        this.submitted.set(true);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.error || 'Could not submit. Please try again.');
      },
    });
  }

  reset() {
    this.form.reset({
      bloodGroup: null,
      unitsNeeded: 1,
      urgency: 'high',
      hospitalName: '',
      city: null,
      contactName: '',
      contactPhone: '',
      neededBy: null,
      notes: '',
    });
    this.submitted.set(false);
    this.error.set(null);
  }

  urgencyLabel(u: UrgencyLevel): string {
    return u.charAt(0).toUpperCase() + u.slice(1);
  }
}
