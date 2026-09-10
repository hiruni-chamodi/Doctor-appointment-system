import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar, NavItem } from '../sidebar/sidebar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-patient-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './patient-layout.html',
  styleUrl: './patient-layout.css',
})
export class PatientLayout {
  protected readonly profileName: string;
  protected readonly profileRole = 'Patient';
  protected readonly primaryActionLabel = 'Book Appointment';

  protected readonly navItems: NavItem[] = [
    { label: 'My Appointments', icon: 'appointments', path: '/my-appointments' },
    { label: 'Book Appointment', icon: 'book', path: '/find-doctor' },
    { label: 'Medical Records', icon: 'records', path: '/medical-records' },
    { label: 'Profile', icon: 'profile', path: '/profile' },
    { label: 'Settings', icon: 'settings', path: '/profile' },
  ];

  constructor(private authService: AuthService) {
    this.profileName = this.authService.getCurrentUser()?.fullName ?? 'Patient';
  }
}
