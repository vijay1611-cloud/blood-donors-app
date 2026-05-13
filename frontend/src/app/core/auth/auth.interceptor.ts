import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { from, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }
  const auth = inject(Auth);
  const user = auth.currentUser;
  if (!user) return next(req);

  return from(user.getIdToken()).pipe(
    switchMap((token) => {
      const authed = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
      return next(authed);
    }),
  );
};
