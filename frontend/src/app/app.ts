import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  firstName = '';
  lastName = '';
  email = '';
  phone = '';

  constructor(private http: HttpClient) {}

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
          this.firstName = '';
          this.lastName = '';
          this.email = '';
          this.phone = '';
        },
        error: (err) => {
          alert('Failed to save patient. Check the console for details.');
          console.error(err);
        }
      });
  }
}