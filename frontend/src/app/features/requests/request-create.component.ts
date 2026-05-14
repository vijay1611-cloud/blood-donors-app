import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RequestService } from '../../core/api/request.service';
import { BLOOD_GROUPS, BloodGroup } from '../../core/models/blood-group';
import { CHENNAI_LOCALITIES, ChennaiLocality } from '../../core/models/localities';
import { URGENCY_LEVELS, UrgencyLevel, BloodRequestInput } from '../../core/models/blood-request';

@Component({
  selector: 'app-request-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
  ],
  template: `
    <h1>New blood request</h1>

    <mat-card>
      <form [formGroup]="form" (ngSubmit)="submit()" class="grid">
        <mat-form-field appearance="outline">
          <mat-label>Blood group</mat-label>
          <mat-select formControlName="bloodGroup">
            @for (g of groups; track g) {
              <mat-option [value]="g">{{ g }}</mat-option>
            }
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
            @for (c of localities; track c) {
              <mat-option [value]="c">{{ c }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Contact name</mat-label>
          <input matInput formControlName="contactName" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="span-2">
          <mat-label>Contact phone</mat-label>
          <input matInput type="tel" formControlName="contactPhone" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="span-2">
          <mat-label>Notes (optional)</mat-label>
          <textarea matInput formControlName="notes" rows="3"></textarea>
        </mat-form-field>

        <div class="span-2 actions">
          <button mat-button type="button" (click)="cancel()">Cancel</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
            {{ saving() ? 'Saving…' : 'Create request' }}
          </button>
        </div>
      </form>
    </mat-card>
  `,
  styles: [`
    h1 { margin: 0 0 16px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px; }
    .span-2 { grid-column: span 2; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; }
    @media (max-width: 600px) {
      .grid { grid-template-columns: 1fr; }
      .span-2 { grid-column: span 1; }
    }
  `],
})
export class RequestCreateComponent {
  private fb = inject(FormBuilder);
  private requests = inject(RequestService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  groups = BLOOD_GROUPS;
  urgencies = URGENCY_LEVELS;
  localities = CHENNAI_LOCALITIES;
  saving = signal(false);
  today = new Date();

  form = this.fb.nonNullable.group({
    bloodGroup: [null as BloodGroup | null, Validators.required],
    unitsNeeded: [1, [Validators.required, Validators.min(1), Validators.max(50)]],
    urgency: ['normal' as UrgencyLevel, Validators.required],
    hospitalName: ['', Validators.required],
    city: [null as ChennaiLocality | null, Validators.required],
    contactName: ['', Validators.required],
    contactPhone: ['', Validators.required],
    neededBy: [null as Date | null],
    notes: [''],
  });

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
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
    this.requests.create(payload).subscribe({
      next: (created) => {
        this.snack.open('Request created', 'OK', { duration: 2000 });
        this.router.navigate(['/requests', created._id]);
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(err?.error?.error || 'Could not create request', 'Dismiss', { duration: 4000 });
      },
    });
  }

  cancel() {
    this.router.navigateByUrl('/requests');
  }

  urgencyLabel(u: UrgencyLevel): string {
    return u.charAt(0).toUpperCase() + u.slice(1);
  }
}
