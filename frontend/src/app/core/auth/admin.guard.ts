import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const user = auth.currentUser;
  if (!user) return router.createUrlTree(['/login']);
  const tokenResult = await user.getIdTokenResult();
  if (tokenResult.claims['admin'] === true) return true;
  return router.createUrlTree(['/home']);
};
