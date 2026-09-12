import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Appointment, AppointmentService } from '../services/appointment.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  protected readonly allAppointments = signal<Appointment[]>([]);
  protected readonly appointments = signal<Appointment[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal('');
  protected readonly submitting = signal<string | null>(null);
  protected departmentFilter = '';
  protected doctorFilter = '';

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.appointmentService.getAll().subscribe({
      next: (appointments) => {
        this.allAppointments.set(appointments);
        this.appointments.set(appointments.filter((appointment) => appointment.status === 'PENDING'));
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load pending appointments right now.');
        this.isLoading.set(false);
      },
    });
  }

  protected get registeredPatients(): number {
    return new Set(this.allAppointments().map((appointment) => appointment.patientId)).size;
  }

  protected get doctorsOnShift(): number {
    return new Set(this.allAppointments().map((appointment) => appointment.doctorId)).size;
  }

  protected get pendingRequests(): number {
    return this.allAppointments().filter((appointment) => appointment.status === 'PENDING').length;
  }

  protected get departments(): string[] {
    return [...new Set(this.appointments().map((appointment) => appointment.doctorSpecialty || 'General Practice'))].sort();
  }

  protected get filteredAppointments(): Appointment[] {
    const department = this.departmentFilter.trim().toLowerCase();
    const doctor = this.doctorFilter.trim().toLowerCase();
    return this.appointments().filter((appointment) => {
      const specialty = (appointment.doctorSpecialty || 'General Practice').toLowerCase();
      return (!department || specialty === department)
        && (!doctor || appointment.doctorName.toLowerCase().includes(doctor));
    });
  }

  protected applyFilters(): void {
    // The getters derive the table from the current filter values.
  }

  protected updateStatus(appointment: Appointment, status: 'CONFIRMED' | 'REJECTED'): void {
    if (this.submitting()) {
      return;
    }

    this.submitting.set(appointment.id);
    this.appointmentService.updateStatus(appointment.id, status).subscribe({
      next: () => {
        this.appointments.update((current) => current.filter((item) => item.id !== appointment.id));
        this.submitting.set(null);
      },
      error: (error) => {
        this.loadError.set(error?.error?.message || 'Unable to update this appointment.');
        this.submitting.set(null);
      },
    });
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
}
