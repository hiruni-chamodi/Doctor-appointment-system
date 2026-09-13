import { Component, OnInit, signal } from '@angular/core';
import { Appointment, AppointmentService } from '../services/appointment.service';

@Component({
  selector: 'app-receptionist-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './receptionist-dashboard.html',
  styleUrl: './receptionist-dashboard.css',
})
export class ReceptionistDashboard implements OnInit {
  protected readonly appointments = signal<Appointment[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal('');
  protected readonly submitting = signal<string | null>(null);

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  protected accept(appointment: Appointment): void {
    this.updateStatus(appointment, 'CONFIRMED');
  }

  protected decline(appointment: Appointment): void {
    this.updateStatus(appointment, 'REJECTED');
  }

  protected formatDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private loadAppointments(): void {
    this.appointmentService.getAll().subscribe({
      next: (appointments) => {
        this.appointments.set(appointments.filter((appointment) => appointment.status === 'PENDING'));
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load appointments right now.');
        this.isLoading.set(false);
      },
    });
  }

  private updateStatus(appointment: Appointment, status: 'CONFIRMED' | 'REJECTED'): void {
    if (this.submitting()) {
      return;
    }

    this.submitting.set(appointment.id);
    this.appointmentService.updateStatus(appointment.id, status).subscribe({
      next: () => {
        this.appointments.update((appointments) =>
          appointments.filter((current) => current.id !== appointment.id),
        );
        this.submitting.set(null);
      },
      error: (error) => {
        this.loadError.set(error?.error?.message || 'Unable to update this appointment.');
        this.submitting.set(null);
      },
    });
  }
}
