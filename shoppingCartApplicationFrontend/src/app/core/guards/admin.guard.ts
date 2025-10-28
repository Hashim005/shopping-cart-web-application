import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../modules/auth/auth.service';
import { ToastService } from '../../services/toast.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  // Check if user is logged in
  if (!authService.isLoggedIn()) {
    toastService.warning('Please login to access this page');
    router.navigate(['/auth/login']);
    return false;
  }

  // Check if user is admin
  if (authService.isAdmin()) {
    return true; // Allow access
  } else {
    toastService.error('Access denied. Admin privileges required.');
    router.navigate(['/auth/login']); // Redirect to products
    return false; // Deny access
  }
};
