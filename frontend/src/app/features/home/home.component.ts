import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DonorService } from '../../core/api/donor.service';
import { Donor } from '../../core/models/donor';
import { EligibilityBadgeComponent } from '../../shared/eligibility-badge.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EligibilityBadgeComponent,
  ],
  template: `
    @if (loading()) {
      <mat-spinner diameter="32" />
    } @else if (donor()) {
      <section class="hero">
        <h1>Welcome{{ donor()!.firstName ? ', ' + donor()!.firstName : '' }} 👋</h1>
        <app-eligibility-badge [eligibility]="donor()!.eligibility" />
      </section>

      @if (!donor()!.firstName || !donor()!.bloodGroup || !donor()!.city) {
        <mat-card class="prompt">
          <h3>Finish your profile</h3>
          <p>Add your name, blood group, and city so others can find you.</p>
          <a mat-flat-button color="primary" routerLink="/profile">Complete profile</a>
        </mat-card>
      }

      <div class="grid">
        <mat-card class="link-card">
          <mat-icon>person</mat-icon>
          <h3>Your profile</h3>
          <p>Manage your donor information.</p>
          <a mat-stroked-button routerLink="/profile">Open</a>
        </mat-card>

        <mat-card class="link-card">
          <mat-icon>group</mat-icon>
          <h3>Donor directory</h3>
          <p>Find donors by blood group and city.</p>
          <a mat-stroked-button routerLink="/directory">Browse</a>
        </mat-card>

        <mat-card class="link-card">
          <mat-icon>history</mat-icon>
          <h3>Donations</h3>
          <p>View and log your donations.</p>
          <a mat-stroked-button routerLink="/donations">Open</a>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .hero { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; margin-bottom: 24px; }
    h1 { margin: 0; }
    .prompt { padding: 16px; margin-bottom: 16px; background: #fff8e1; }
    .prompt h3 { margin: 0 0 4px; }
    .prompt p { margin: 0 0 12px; color: #666; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
    .link-card { padding: 20px; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
    .link-card mat-icon { font-size: 32px; height: 32px; width: 32px; color: #c62828; }
    .link-card h3 { margin: 0; }
    .link-card p { margin: 0; color: #666; flex: 1; }
  `],
})
export class HomeComponent {
  private donors = inject(DonorService);
  donor = signal<Donor | null>(null);
  loading = signal(true);

  constructor() {
    this.donors.getMe().subscribe({
      next: (d) => {
        this.donor.set(d);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
