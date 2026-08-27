import { Component } from '@angular/core';
import { Sidebar, NavItem } from '../layout/sidebar/sidebar';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-patient-dashboard',
  imports: [Sidebar],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.css',
})
export class PatientDashboardComponent {
  protected readonly profileRole = 'Patient';
  protected readonly primaryActionLabel = 'Book Appointment';
  protected readonly profileName: string;

  protected readonly navItems: NavItem[] = [
    { label: 'My Appointments', icon: 'appointments', path: '/patient-dashboard' },
    { label: 'Book Appointment', icon: 'book', path: '/patient-dashboard' },
    { label: 'Medical Records', icon: 'records', path: '/patient-dashboard' },
    { label: 'Profile', icon: 'profile', path: '/patient-dashboard' },
    { label: 'Settings', icon: 'settings', path: '/patient-dashboard' },
  ];

  constructor(private authService: AuthService) {
    this.profileName = this.authService.getCurrentUser()?.fullName ?? 'Patient';
  }
}
