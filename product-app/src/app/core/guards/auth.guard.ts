import { inject } from '@angular/core';
import { type CanMatchFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Blocks the app shell until a session exists, remembering the target URL. */
export const authGuard: CanMatchFn = (_route, segments) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;

  const redirect = '/' + segments.map((s) => s.path).join('/');
  return router.createUrlTree(['/login'], { queryParams: { redirect } });
};

/** Keeps authenticated users away from the login screen. */
export const guestGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
};
