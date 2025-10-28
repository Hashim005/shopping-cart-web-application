import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../modules/auth/auth.service';
import { inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
 const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const router = inject(Router);

  const token = authService.getToken();

  // Clone request and add Authorization header if token exists
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // console.log('🔒 Request with Bearer Token:', authReq.headers.get('Authorization'));

  // Handle response and errors
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {

      if (error.status === 401) {
        toastService.error('Session expired. Please login again.');
        authService.logout();
      }

      // Handle 403 Forbidden (insufficient permissions)
      if (error.status === 403) {
        toastService.error('Access denied. Insufficient permissions.');
        router.navigate(['auth/login']);
      }

      // Handle 500 Internal Server Error
      if (error.status === 500) {
        toastService.error('Server error. Please try again later.');
      }

      // Handle network errors
      if (error.status === 0) {
        toastService.error('Cannot connect to server. Please check your connection.');
      }

      return throwError(() => error);
    })
  );
};
