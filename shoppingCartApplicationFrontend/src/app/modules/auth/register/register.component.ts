import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { ToastService } from '../../../services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {

  constructor( private authService: AuthService,
    private toastService: ToastService,
    private router: Router) {}

  public name: string = '';
  public email: string = '';
  public password: string = '';
  public confirm_password: string = '';

  isLoading: boolean = false;


  validateForm(): boolean {
    // Check empty fields
    if (!this.name || !this.email || !this.password || !this.confirm_password) {
      this.toastService.warning('Please fill in all required fields');
      return false;
    }

    // Validate name
    if (this.name.trim().length < 2) {
      this.toastService.warning('Name must be at least 2 characters long');
      return false;
    }

    // Validate email
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

    // Validate confirm password
    if (this.password !== this.confirm_password) {
      this.toastService.error('Passwords do not match');
      return false;
    }

    return true;
  }

  onRegister(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;

    const payload: any = {
      name: this.name.trim(),
      email: this.email.trim(),
      password: this.password,
      confirm_password: this.confirm_password
    };

    this.authService.RegisterUser(payload).subscribe({
      next: (res:any) => {
        console.log(res);

        res.statusCode == 200
        if (res.statusCode === 200 && res.data) {
          // Success - auto-closes in 5 seconds
          this.toastService.success(res.message || 'Registration successful!');

          // Save token and user
          this.authService.saveToken(res.data.token);
          this.authService.saveUser(res.data.user);

          // Info message - auto-closes in 5 seconds
          this.toastService.info(`Welcome, ${res.data.user.name}! Role: ${res.data.user.role}`);

          // Redirect after 1.5 seconds
          setTimeout(() => {
            this.router.navigate(['auth/login']);
          }, 1500);
        } else {
          this.toastService.error(res.message || 'Registration failed');
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Registration error:', error);

        if (error.error && error.error.message) {
          // Error message - auto-closes in 5 seconds
          this.toastService.error(error.error.message);
        } else if (error.status === 0) {
          this.toastService.error('Cannot connect to server. Please check your connection.');
        } else {
          this.toastService.error('An error occurred during registration');
        }

        this.isLoading = false;
      }
    });
  }


}
