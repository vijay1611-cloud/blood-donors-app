import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <mat-toolbar color="primary">
      <span class="brand">🩸 Blood Donors</span>
      <nav class="nav">
        <a mat-button routerLink="/home" routerLinkActive="active">Home</a>
        <a mat-button routerLink="/directory" routerLinkActive="active">Directory</a>
        <a mat-button routerLink="/donations" routerLinkActive="active">Donations</a>
        <a mat-button routerLink="/profile" routerLinkActive="active">Profile</a>
      </nav>
      <span class="spacer"></span>
      <button mat-button (click)="logout()">Log out</button>
    </mat-toolbar>

    <main class="content">
      <router-outlet />
    </main>
  `,
  styles: [`
    .brand { font-weight: 600; margin-right: 24px; }
    .nav { display: flex; gap: 4px; }
    .nav .active { background: rgba(255,255,255,0.15); }
    .spacer { flex: 1 1 auto; }
    .content { padding: 24px; max-width: 1100px; margin: 0 auto; }
  `],
})
export class ShellComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  async logout() {
    await this.auth.signOut();
    this.router.navigateByUrl('/login');
  }
}
