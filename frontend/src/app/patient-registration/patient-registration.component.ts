import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-patient-registration',
  imports: [FormsModule],
  templateUrl: './patient-registration.component.html',
  styleUrl: './patient-registration.component.css',
})
export class PatientRegistrationComponent {
  firstName = '';
  lastName = '';
  email = '';
  phone = '';

  constructor(private http: HttpClient, private router: Router) {}

  submitRegistration() {
    const newPatient = {
      name: this.firstName.trim() + ' ' + this.lastName.trim(),
      email: this.email,
      phone: this.phone
    };

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    this.http.post('http://localhost:8081/api/patients', newPatient, { headers })
      .subscribe({
        next: (response) => {
          alert('Success! Patient saved to MongoDB Atlas.');
          console.log('Saved Patient:', response);
          this.resetForm();
          this.router.navigate(['/patient-dashboard']);
        },
        error: (err) => {
          alert('Failed to save patient. Check the console for details.');
          console.error(err);
        }
      });
  }

  private resetForm() {
    this.firstName = '';
    this.lastName = '';
    this.email = '';
    this.phone = '';
  }
}
