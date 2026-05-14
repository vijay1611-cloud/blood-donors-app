import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DonorService } from '../../core/api/donor.service';
import { RequestService } from '../../core/api/request.service';
import { AuthService } from '../../core/auth/auth.service';
import { Donor } from '../../core/models/donor';
import { BloodRequest } from '../../core/models/blood-request';
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

      @if (matching().length > 0) {
        <mat-card class="matches">
          <div class="matches-header">
            <mat-icon class="urgent">priority_high</mat-icon>
            <h3>
              {{ matching().length }} request{{ matching().length > 1 ? 's' : '' }} match your
              blood group and city
            </h3>
          </div>
          <ul>
            @for (r of matching().slice(0, 3); track r._id) {
              <li>
                <a [routerLink]="['/requests', r._id]">
                  <strong>{{ r.hospitalName }}</strong> · {{ r.city }} ·
                  <span class="bg-tiny">{{ r.bloodGroup }}</span> ·
                  {{ r.unitsNeeded }} unit{{ r.unitsNeeded > 1 ? 's' : '' }} ·
                  <span [class]="'urgency-' + r.urgency">{{ r.urgency }}</span>
                </a>
              </li>
            }
          </ul>
          <a mat-stroked-button routerLink="/requests" [queryParams]="{matching: 1}">
            See all matching requests
          </a>
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
          <mat-icon>bloodtype</mat-icon>
          <h3>Blood requests</h3>
          <p>See open requests and offer to help.</p>
          <a mat-stroked-button routerLink="/requests">Browse</a>
        </mat-card>

        @if (auth.isAdmin()) {
          <mat-card class="link-card">
            <mat-icon>group</mat-icon>
            <h3>Donor directory</h3>
            <p>Find donors by blood group and city.</p>
            <a mat-stroked-button routerLink="/directory">Browse</a>
          </mat-card>

          <mat-card class="link-card">
            <mat-icon>admin_panel_settings</mat-icon>
            <h3>Admins</h3>
            <p>Grant or revoke admin access.</p>
            <a mat-stroked-button routerLink="/admin/users">Manage</a>
          </mat-card>
        }

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
    .matches { padding: 16px; margin-bottom: 16px; background: #ffebee; border-left: 4px solid #c62828; }
    .matches-header { display: flex; align-items: center; gap: 8px; }
    .matches-header h3 { margin: 0; }
    .matches .urgent { color: #c62828; }
    .matches ul { margin: 8px 0; padding-left: 0; list-style: none; }
    .matches li { margin: 4px 0; font-size: 14px; }
    .matches a { color: inherit; text-decoration: none; }
    .matches a:hover { text-decoration: underline; }
    .bg-tiny { background: #c62828; color: white; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .urgency-critical { color: #c62828; font-weight: 500; }
    .urgency-high { color: #ef6c00; font-weight: 500; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
    .link-card { padding: 20px; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
    .link-card mat-icon { font-size: 32px; height: 32px; width: 32px; color: #c62828; }
    .link-card h3 { margin: 0; }
    .link-card p { margin: 0; color: #666; flex: 1; }
  `],
})
export class HomeComponent {
  private donors = inject(DonorService);
  private requests = inject(RequestService);
  auth = inject(AuthService);

  donor = signal<Donor | null>(null);
  matching = signal<BloodRequest[]>([]);
  loading = signal(true);

  constructor() {
    this.donors.getMe().subscribe({
      next: (d) => {
        this.donor.set(d);
        this.loading.set(false);
        if (d.bloodGroup && d.city) {
          this.requests.list({ matching: true }).subscribe({
            next: (rs) => this.matching.set(rs),
            error: () => {},
          });
        }
      },
      error: () => this.loading.set(false),
    });
  }
}
