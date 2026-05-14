import { Component, inject, signal, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RequestService } from '../../core/api/request.service';
import { AuthService } from '../../core/auth/auth.service';
import { BloodRequest, Responder, RequestStatus } from '../../core/models/blood-request';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  template: `
    <a routerLink="/requests" class="back"><mat-icon>arrow_back</mat-icon> Back to requests</a>

    @if (loading()) {
      <mat-spinner diameter="32" />
    } @else if (request()) {
      @let r = request()!;
      <mat-card class="detail" [class]="'urgency-' + r.urgency">
        <div class="row">
          <div>
            <h1>{{ r.hospitalName }}</h1>
            <p class="muted">{{ r.city }} · Posted {{ r.createdAt | date:'mediumDate' }}</p>
          </div>
          <span class="bg-chip">{{ r.bloodGroup }}</span>
        </div>

        <div class="meta">
          <div><strong>Status:</strong> <span [class]="'status-' + r.status">{{ r.status }}</span></div>
          <div><strong>Urgency:</strong> {{ urgencyLabel(r.urgency) }}</div>
          <div><strong>Units needed:</strong> {{ r.unitsNeeded }}</div>
          @if (r.neededBy) {
            <div><strong>Needed by:</strong> {{ r.neededBy | date:'mediumDate' }}</div>
          }
          <div><strong>Contact:</strong> {{ r.contactName }}</div>
          <div><strong>Phone:</strong> <a [href]="'tel:' + r.contactPhone">{{ r.contactPhone }}</a></div>
        </div>

        @if (r.notes) {
          <div class="notes"><strong>Notes:</strong> {{ r.notes }}</div>
        }

        <mat-divider />

        <div class="actions">
          @if (r.status === 'open' && !r.hasResponded) {
            <button mat-flat-button color="primary" (click)="respond()" [disabled]="responding()">
              <mat-icon>volunteer_activism</mat-icon>
              {{ responding() ? 'Sending…' : 'I can help' }}
            </button>
          } @else if (r.hasResponded) {
            <span class="responded"><mat-icon>check_circle</mat-icon> You responded to this request</span>
          }

          @if (auth.isAdmin()) {
            @if (r.status === 'open') {
              <button mat-stroked-button (click)="updateStatus('fulfilled')">Mark fulfilled</button>
              <button mat-stroked-button color="warn" (click)="updateStatus('cancelled')">Cancel</button>
            }
          }
        </div>
      </mat-card>

      @if (auth.isAdmin()) {
        <h2 class="responders-heading">
          Responders ({{ responders().length }})
        </h2>
        @if (loadingResponders()) {
          <mat-spinner diameter="24" />
        } @else if (responders().length === 0) {
          <mat-card class="empty"><p>No responders yet.</p></mat-card>
        } @else {
          <mat-card>
            <mat-list>
              @for (resp of responders(); track resp.responseId) {
                <mat-list-item>
                  <span matListItemTitle>
                    {{ resp.donor?.firstName }} {{ resp.donor?.lastName }}
                    <span class="bg-tiny">{{ resp.donor?.bloodGroup }}</span>
                  </span>
                  <span matListItemLine>
                    {{ resp.donor?.city || '—' }} ·
                    <a [href]="'tel:' + resp.donor?.phone">{{ resp.donor?.phone || 'no phone' }}</a>
                    · responded {{ resp.respondedAt | date:'short' }}
                  </span>
                  @if (resp.note) {
                    <span matListItemLine class="muted">"{{ resp.note }}"</span>
                  }
                </mat-list-item>
              }
            </mat-list>
          </mat-card>
        }
      }
    } @else {
      <p class="muted">Request not found.</p>
    }
  `,
  styles: [`
    .back { display: inline-flex; align-items: center; gap: 4px; text-decoration: none; color: #1976d2; margin-bottom: 16px; }
    .detail { padding: 24px; border-left: 6px solid transparent; }
    .urgency-critical { border-left-color: #c62828; }
    .urgency-high { border-left-color: #ef6c00; }
    .urgency-normal { border-left-color: #1976d2; }
    .urgency-low { border-left-color: #9e9e9e; }
    .row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    h1 { margin: 0 0 4px; }
    .muted { color: #666; margin: 0; }
    .bg-chip { background: #c62828; color: white; padding: 6px 14px; border-radius: 999px; font-weight: 600; }
    .bg-tiny { background: #c62828; color: white; padding: 2px 8px; border-radius: 999px; font-size: 11px; margin-left: 6px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin: 16px 0; }
    .meta div { font-size: 14px; }
    .notes { margin: 16px 0; padding: 12px; background: #fafafa; border-radius: 6px; font-size: 14px; }
    .actions { display: flex; gap: 12px; align-items: center; padding-top: 16px; flex-wrap: wrap; }
    .responded { display: inline-flex; align-items: center; gap: 6px; color: #2e7d32; font-weight: 500; }
    .status-open { color: #2e7d32; font-weight: 500; }
    .status-fulfilled { color: #1976d2; }
    .status-cancelled, .status-expired { color: #9e9e9e; }
    .responders-heading { margin-top: 32px; }
    .empty { padding: 16px; text-align: center; }
    @media (max-width: 600px) { .meta { grid-template-columns: 1fr; } }
  `],
})
export class RequestDetailComponent implements OnInit {
  private requests = inject(RequestService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  auth = inject(AuthService);

  id = input.required<string>();

  request = signal<BloodRequest | null>(null);
  responders = signal<Responder[]>([]);
  loading = signal(true);
  loadingResponders = signal(false);
  responding = signal(false);

  ngOnInit() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.requests.get(this.id()).subscribe({
      next: (r) => {
        this.request.set(r);
        this.loading.set(false);
        if (this.auth.isAdmin()) this.loadResponders();
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private loadResponders() {
    this.loadingResponders.set(true);
    this.requests.responders(this.id()).subscribe({
      next: (rs) => {
        this.responders.set(rs);
        this.loadingResponders.set(false);
      },
      error: () => this.loadingResponders.set(false),
    });
  }

  respond() {
    this.responding.set(true);
    this.requests.respond(this.id()).subscribe({
      next: () => {
        this.snack.open('Thanks for responding!', 'OK', { duration: 2000 });
        this.responding.set(false);
        this.load();
      },
      error: (err) => {
        this.responding.set(false);
        const msg = err?.error?.error || 'Could not record your response';
        this.snack.open(msg, 'Dismiss', { duration: 4000 });
      },
    });
  }

  updateStatus(status: RequestStatus) {
    this.requests.updateStatus(this.id(), status).subscribe({
      next: (updated) => {
        this.request.set({ ...updated, hasResponded: this.request()?.hasResponded });
        this.snack.open(`Marked as ${status}`, 'OK', { duration: 2000 });
      },
      error: () => this.snack.open('Could not update', 'Dismiss', { duration: 4000 }),
    });
  }

  urgencyLabel(u: string): string {
    return u.charAt(0).toUpperCase() + u.slice(1);
  }
}
