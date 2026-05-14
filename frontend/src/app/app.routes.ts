import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';
import { adminGuard } from './core/auth/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/signup.component').then((m) => m.SignupComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'directory',
        loadComponent: () =>
          import('./features/directory/directory.component').then((m) => m.DirectoryComponent),
      },
      {
        path: 'donations',
        loadComponent: () =>
          import('./features/donations/donations.component').then((m) => m.DonationsComponent),
      },
      {
        path: 'requests',
        loadComponent: () =>
          import('./features/requests/requests-list.component').then((m) => m.RequestsListComponent),
      },
      {
        path: 'requests/new',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/requests/request-create.component').then((m) => m.RequestCreateComponent),
      },
      {
        path: 'requests/:id',
        loadComponent: () =>
          import('./features/requests/request-detail.component').then((m) => m.RequestDetailComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
