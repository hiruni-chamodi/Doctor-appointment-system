import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';
  errorMessage = '';
  isSubmitting = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  submitLogin() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;

    this.authService.login(this.email, this.password).subscribe({
      next: (user) => {
        this.isSubmitting = false;
        if (user.role === 'DOCTOR') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/patient-dashboard']);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.message ?? 'Unable to sign in. Please try again.';
      },
    });
  }
}
