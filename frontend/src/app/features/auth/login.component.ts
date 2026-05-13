import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <div class="auth-page">
      <mat-card class="auth-card">
        <mat-card-title>Welcome back</mat-card-title>
        <mat-card-subtitle>Sign in to continue</mat-card-subtitle>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline" class="full">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="current-password" />
          </mat-form-field>
          @if (error()) { <p class="error">{{ error() }}</p> }
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading()" class="full">
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
        <p class="muted">No account? <a routerLink="/signup">Create one</a></p>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-page { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 16px; background: #fafafa; }
    .auth-card { width: 100%; max-width: 400px; padding: 24px; }
    .full { width: 100%; display: block; }
    form { display: flex; flex-direction: column; gap: 4px; margin-top: 16px; }
    .error { color: #c62828; margin: 4px 0; }
    .muted { color: #666; margin-top: 16px; text-align: center; }
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.signIn(email, password);
      this.router.navigateByUrl('/home');
    } catch (e: any) {
      this.error.set(this.friendly(e?.code) || e?.message || 'Sign-in failed');
    } finally {
      this.loading.set(false);
    }
  }

  private friendly(code?: string): string | null {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Email or password is incorrect.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Try again later.';
      default:
        return null;
    }
  }
}
