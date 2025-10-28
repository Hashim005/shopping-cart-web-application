import { Component } from '@angular/core';
import { AuthService } from '../../modules/auth/auth.service';
import { ToastService } from '../../services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
   userName: string = '';
  userRole: string = '';
  isAdmin: boolean = false;

  // Mobile menu toggle
  isMobileMenuOpen: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    // Get user information
    const user = this.authService.getUser();
    if (user) {
      this.userName = user.name;
      this.userRole = user.role;
      this.isAdmin = this.authService.isAdmin();
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
  goToProducts(): void {
    this.router.navigate(['/products']);
    this.isMobileMenuOpen = false;
  }
  goToCart(): void {
    this.router.navigate(['/cart']);
    this.isMobileMenuOpen = false;
  }

  goToOrders(): void {
    this.router.navigate(['/orders']);
    this.isMobileMenuOpen = false;
  }

  goToAdmin(): void {
    if (this.isAdmin) {
      this.router.navigate(['/admin']);
      this.isMobileMenuOpen = false;
    }
  }

  logout(): void {
    this.toastService.info('Logging out...');
    setTimeout(() => {
      this.authService.logout();
      this.toastService.success('Logged out successfully');
    }, 500);
  }

}
