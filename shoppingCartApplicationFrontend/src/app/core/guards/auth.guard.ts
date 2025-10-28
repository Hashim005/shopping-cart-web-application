import { inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../modules/auth/auth.service';
import { ToastService } from '../../services/toast.service';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = ( route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);
  const platformId = inject(PLATFORM_ID);

   if (!isPlatformBrowser(platformId)) {
    return false; // Deny access during SSR, will recheck on client
  }

  // Check if user is logged in with valid Bearer token
  if (authService.isLoggedIn()) {
    return true; // Allow access
  } else {
    // Show warning message
    toastService.warning('Please login to access this page');

    // Redirect to login page with return URL
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });

    return false; // Deny access
  }
};
