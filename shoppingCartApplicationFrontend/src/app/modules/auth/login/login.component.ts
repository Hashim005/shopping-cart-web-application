import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { ToastService } from '../../../services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if user is already logged in
    // if (this.authService.isLoggedIn()) {
    //   this.toastService.info('You are already logged in');
    //   this.router.navigate(['/home']);
    // }
  }

  // Form fields
  public email: string = '';
  public password: string = '';

  // Loading state
  isLoading: boolean = false;

  // Show/hide password
  showPassword: boolean = false;

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Validate form before submission
   */
  validateForm(): boolean {
    // Check empty fields
    if (!this.email || !this.password) {
      this.toastService.warning('Please fill in all required fields');
      return false;
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(this.email)) {
      this.toastService.warning('Please enter a valid email address');
      return false;
    }

    // Validate password
    if (this.password.length < 6) {
      this.toastService.warning('Password must be at least 6 characters long');
      return false;
    }

    return true;
  }

  /**
   * Handle login form submission
   */
  onLogin(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;

    const payload = {
      email: this.email.trim(),
      password: this.password
    };

    this.authService.LoginUser(payload).subscribe({
      next: (res: any) => {
        if (res.statusCode === 200 && res.data) {

          this.authService.saveToken(res.data.token);
          this.authService.saveUser(res.data.user);
          setTimeout(() => {
            if (res.data.user.role === 'user') {
              this.router.navigate(['/home']);
            }
          }, 1500);
        } else {
          // Handle error response
          this.toastService.error(res.message || 'Login failed');
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Login error:', error);

        // Handle different error scenarios
        if (error.error && error.error.message) {
          this.toastService.error(error.error.message);
        }
        this.isLoading = false;
      }
    });
  }

}
