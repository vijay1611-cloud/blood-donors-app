import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { DonationInput } from '../../core/models/donation';

@Component({
  selector: 'app-donation-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Log a donation</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="date" [max]="today" />
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Location</mat-label>
          <input matInput formControlName="location" placeholder="e.g. Red Cross, Chennai" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form { display: flex; flex-direction: column; gap: 4px; min-width: 320px; }
    .full { width: 100%; }
  `],
})
export class DonationDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<DonationDialogComponent>);

  today = new Date();

  form = this.fb.nonNullable.group({
    date: [new Date() as Date | null, Validators.required],
    location: [''],
    notes: [''],
  });

  cancel() {
    this.dialogRef.close(null);
  }

  save() {
    if (this.form.invalid) return;
    const { date, location, notes } = this.form.getRawValue();
    const payload: DonationInput = {
      date: (date as Date).toISOString(),
      location: location.trim(),
      notes: notes.trim(),
    };
    this.dialogRef.close(payload);
  }
}
