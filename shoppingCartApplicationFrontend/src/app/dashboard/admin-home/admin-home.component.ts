import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../../modules/auth/auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-admin-home',
  standalone: false,
  templateUrl: './admin-home.component.html',
  styleUrl: './admin-home.component.scss'
})
export class AdminHomeComponent {
   public isMobileMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.checkAdminAccess();
  }

  checkAdminAccess(): void {
    if (isPlatformBrowser(this.platformId)) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.role !== 'admin') {
            this.toastService.error('Access denied. Admin only.');
            this.router.navigate(['/auth/login']);
          }
        } catch (error) {
          this.toastService.error('Error parsing user data');
          this.router.navigate(['/auth/login']);
        }
      } else {
        this.router.navigate(['/auth/login']);
      }
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
      this.toastService.showSuccess('Logged out successfully');
      this.router.navigate(['/auth/login']);
    }
  }

}
