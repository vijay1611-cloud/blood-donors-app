import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService, AdminUser } from '../../core/api/admin.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h1>Admin users</h1>
    <p class="muted">Anyone listed here can post blood requests, view all donors, and grant or revoke admin access.</p>

    <mat-card class="grant-card">
      <h3>Grant admin to a user</h3>
      <form [formGroup]="form" (ngSubmit)="grant()" class="form-row">
        <mat-form-field appearance="outline" class="grow">
          <mat-label>User's email</mat-label>
          <input matInput type="email" formControlName="email" placeholder="someone@example.com" />
        </mat-form-field>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
          {{ saving() ? 'Granting…' : 'Grant admin' }}
        </button>
      </form>
      <p class="hint">The user must have already signed up. They'll need to sign out and back in to pick up the new role.</p>
    </mat-card>

    <h2>Current admins ({{ admins().length }})</h2>
    @if (loading()) {
      <mat-spinner diameter="32" />
    } @else if (admins().length === 0) {
      <mat-card class="empty"><p>No admins found. (You should at least see yourself — try a refresh.)</p></mat-card>
    } @else {
      <mat-card>
        <mat-list>
          @for (a of admins(); track a.uid) {
            <mat-list-item>
              <span matListItemTitle>
                {{ a.email }}
                @if (a.email === currentEmail()) { <span class="you">(you)</span> }
              </span>
              <span matListItemLine class="muted">
                Created {{ a.createdAt | date:'mediumDate' }}
                @if (a.lastSignInAt) { · last signed in {{ a.lastSignInAt | date:'short' }} }
              </span>
              <button
                mat-icon-button
                matListItemMeta
                color="warn"
                [disabled]="a.email === currentEmail() || revoking() === a.email"
                (click)="revoke(a.email)"
                [attr.aria-label]="'Revoke admin for ' + a.email"
              >
                <mat-icon>remove_circle_outline</mat-icon>
              </button>
            </mat-list-item>
          }
        </mat-list>
      </mat-card>
    }
  `,
  styles: [`
    h1 { margin: 0 0 4px; }
    h2 { margin-top: 32px; }
    .muted { color: #666; }
    .grant-card { padding: 16px; margin: 16px 0; }
    .grant-card h3 { margin: 0 0 12px; }
    .form-row { display: flex; gap: 12px; align-items: flex-start; }
    .grow { flex: 1; }
    .hint { margin: 8px 0 0; font-size: 13px; color: #666; }
    .you { color: #1976d2; font-size: 13px; margin-left: 6px; }
    .empty { padding: 16px; text-align: center; }
  `],
})
export class AdminUsersComponent {
  private fb = inject(FormBuilder);
  private adminApi = inject(AdminService);
  private snack = inject(MatSnackBar);
  private auth = inject(AuthService);

  admins = signal<AdminUser[]>([]);
  loading = signal(true);
  saving = signal(false);
  revoking = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    this.refresh();
  }

  currentEmail(): string {
    return this.auth.user()?.email || '';
  }

  refresh() {
    this.loading.set(true);
    this.adminApi.listAdmins().subscribe({
      next: (res) => {
        this.admins.set(res.admins);
        this.loading.set(false);
      },
      error: () => {
        this.snack.open('Could not load admins', 'Dismiss', { duration: 4000 });
        this.loading.set(false);
      },
    });
  }

  grant() {
    if (this.form.invalid) return;
    const email = this.form.getRawValue().email.trim();
    this.saving.set(true);
    this.adminApi.grant(email).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.form.reset({ email: '' });
        this.snack.open(res.message, 'OK', { duration: 4000 });
        this.refresh();
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(err?.error?.error || 'Could not grant admin', 'Dismiss', { duration: 4000 });
      },
    });
  }

  revoke(email: string) {
    if (email === this.currentEmail()) return;
    this.revoking.set(email);
    this.adminApi.revoke(email).subscribe({
      next: (res) => {
        this.revoking.set(null);
        this.snack.open(res.message, 'OK', { duration: 4000 });
        this.refresh();
      },
      error: (err) => {
        this.revoking.set(null);
        this.snack.open(err?.error?.error || 'Could not revoke admin', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
