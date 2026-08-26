import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';

  constructor(private router: Router) {}

  submitLogin() {
    // TODO: wire this up to a real authentication endpoint once the backend exposes one.
    // For now, treat any submitted credentials as a successful login.
    if (!this.email || !this.password) {
      alert('Please enter both email and password.');
      return;
    }

    console.log('Logging in as:', this.email);
    this.router.navigate(['/patient-dashboard']);
  }
}
