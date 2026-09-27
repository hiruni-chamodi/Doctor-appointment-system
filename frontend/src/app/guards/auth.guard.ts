import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Allows access to the main dashboard for signed-in doctors and admins. */
export const doctorGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const role = authService.getCurrentUser()?.role;

  if (role === 'DOCTOR' || role === 'ADMIN') {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

/** Allows access only to signed-in admins. */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.getCurrentUser()?.role === 'ADMIN') {
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
