import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

interface BookingDay {
  label: string;
  percent: number;
  active?: boolean;
}

interface Doctor {
  name: string;
  specialty: string;
  initials: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  protected readonly doctorName: string;

  protected readonly stats = {
    todaysAppointments: 24,
    appointmentsChange: '+12% vs last week',
    walkInsAvailable: 5,
  };

  protected readonly bookingTrends: BookingDay[] = [
    { label: 'Mon', percent: 45 },
    { label: 'Tue', percent: 65 },
    { label: 'Wed', percent: 100, active: true },
    { label: 'Thu', percent: 40 },
    { label: 'Fri', percent: 78 },
  ];

  protected readonly doctors: Doctor[] = [
    { name: 'Dr. A. Smith', specialty: 'Neurology', initials: 'AS' },
    { name: 'Dr. S. Lee', specialty: 'Pediatrics', initials: 'SL' },
    { name: 'Dr. B. Jones', specialty: 'General', initials: 'BJ' },
  ];

  constructor(private authService: AuthService) {
    this.doctorName = this.authService.getCurrentUser()?.fullName ?? 'Doctor';
  }
}
