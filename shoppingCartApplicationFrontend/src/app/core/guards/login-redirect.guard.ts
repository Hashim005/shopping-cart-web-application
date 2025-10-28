import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../modules/auth/auth.service';

export const loginRedirectGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If user is already logged in, redirect based on role
  if (authService.isLoggedIn()) {
    const role = authService.getUserRole();

    if (role === 'admin') {
      router.navigate(['/admin']);
    } else {
      router.navigate(['/home']);
    }

    return false; // Deny access to login/register page
  }
  return true;
};
