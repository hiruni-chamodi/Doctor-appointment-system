import { Component } from '@angular/core';
import { Sidebar, NavItem } from '../layout/sidebar/sidebar';
import { AuthService } from '../services/auth.service';
import { BookingModal } from '../booking-modal/booking-modal';

@Component({
  selector: 'app-patient-dashboard',
  imports: [Sidebar, BookingModal],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.css',
})
export class PatientDashboardComponent {
  protected readonly profileRole = 'Patient';
  protected readonly primaryActionLabel = 'Book Appointment';
  protected readonly profileName: string;

  protected isBookingModalOpen = false;
  protected selectedDoctorName = '';
  protected selectedDoctorRole = '';

  openBookingModal(doctorName: string, doctorRole: string) {
    this.selectedDoctorName = doctorName;
    this.selectedDoctorRole = doctorRole;
    this.isBookingModalOpen = true;
  }

  closeBookingModal() {
    this.isBookingModalOpen = false;
  }

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
