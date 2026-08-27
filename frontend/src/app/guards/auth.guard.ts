import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Allows access only to signed-in users with the DOCTOR role; otherwise redirects to /login. */
export const doctorGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.getCurrentUser()?.role === 'DOCTOR') {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

/** Allows access only to signed-in users with the PATIENT role; otherwise redirects to /login. */
export const patientGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.getCurrentUser()?.role === 'PATIENT') {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
