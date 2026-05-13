import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DonationService } from '../../core/api/donation.service';
import { Donation } from '../../core/models/donation';
import { DonationDialogComponent } from './donation-dialog.component';

@Component({
  selector: 'app-donations',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="header">
      <h1>Donation history</h1>
      <button mat-flat-button color="primary" (click)="openDialog()">
        <mat-icon>add</mat-icon>
        Log donation
      </button>
    </div>

    @if (loading()) {
      <mat-spinner diameter="32" />
    } @else if (items().length === 0) {
      <mat-card class="empty">
        <p>No donations logged yet.</p>
        <p class="muted">Log your past donations to track eligibility.</p>
      </mat-card>
    } @else {
      <mat-card>
        <mat-list>
          @for (d of items(); track d._id) {
            <mat-list-item>
              <span matListItemTitle>{{ d.date | date:'mediumDate' }}</span>
              <span matListItemLine>{{ d.location || 'Location not specified' }}</span>
              @if (d.notes) {
                <span matListItemLine class="muted">{{ d.notes }}</span>
              }
            </mat-list-item>
          }
        </mat-list>
      </mat-card>
    }
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    h1 { margin: 0; }
    .empty { padding: 24px; text-align: center; }
    .muted { color: #666; }
  `],
})
export class DonationsComponent {
  private donations = inject(DonationService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  items = signal<Donation[]>([]);
  loading = signal(true);

  constructor() {
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    this.donations.list().subscribe({
      next: (rows) => {
        this.items.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.snack.open('Could not load donations', 'Dismiss', { duration: 4000 });
        this.loading.set(false);
      },
    });
  }

  openDialog() {
    const ref = this.dialog.open(DonationDialogComponent);
    ref.afterClosed().subscribe((input) => {
      if (!input) return;
      this.donations.create(input).subscribe({
        next: () => {
          this.snack.open('Donation logged', 'OK', { duration: 2000 });
          this.refresh();
        },
        error: () => this.snack.open('Could not save donation', 'Dismiss', { duration: 4000 }),
      });
    });
  }
}
