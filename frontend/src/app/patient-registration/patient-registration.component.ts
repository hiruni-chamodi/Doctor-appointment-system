import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';

@Component({
  selector: 'app-patient-registration',
  imports: [FormsModule, RouterLink],
  templateUrl: './patient-registration.component.html',
  styleUrl: './patient-registration.component.css',
})
export class PatientRegistrationComponent {
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  role: UserRole = 'PATIENT';
  specialty = '';
  errorMessage = '';
  isSubmitting = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  submitRegistration() {
    const fullName = `${this.firstName.trim()} ${this.lastName.trim()}`.trim();

    if (!fullName || !this.email || !this.password) {
      this.errorMessage = 'Please fill in your name, email, and password.';
      return;
    }

    if (this.role === 'DOCTOR' && !this.specialty.trim()) {
      this.errorMessage = 'Please enter your specialty.';
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;

    this.authService
      .register(fullName, this.email, this.password, this.role, this.role === 'DOCTOR' ? this.specialty.trim() : undefined)
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          alert('Account created! Please sign in.');
          this.resetForm();
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = err?.error?.message ?? 'Registration failed. Please try again.';
        },
      });
  }

  private resetForm() {
    this.firstName = '';
    this.lastName = '';
    this.email = '';
    this.password = '';
    this.specialty = '';
    this.role = 'PATIENT';
  }
}
