import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Appointment, AppointmentService } from '../services/appointment.service';
import { DoctorEventService } from '../services/doctor-event.service';
import { BOOKABLE_TIME_SLOTS } from '../shared/time-slots';

type ViewMode = 'pending' | 'all';

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

  protected readonly viewMode = signal<ViewMode>('pending');

  protected readonly timeSlots = BOOKABLE_TIME_SLOTS;
  protected readonly schedulingId = signal<string | null>(null);
  protected readonly blockedTimesForScheduling = signal(new Set<string>());
  protected readonly startTimeForScheduling = signal<string | null>(null);
  protected selectedTime = '';

  constructor(
    private appointmentService: AppointmentService,
    private doctorEventService: DoctorEventService,
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  protected setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    this.closeScheduler();
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
    return [...new Set(this.allAppointments().map((appointment) => appointment.doctorSpecialty || 'General Practice'))].sort();
  }

  protected get filteredAppointments(): Appointment[] {
    const source = this.viewMode() === 'pending' ? this.appointments() : this.allAppointments();
    const department = this.departmentFilter.trim().toLowerCase();
    const doctor = this.doctorFilter.trim().toLowerCase();
    return source
      .filter((appointment) => {
        const specialty = (appointment.doctorSpecialty || 'General Practice').toLowerCase();
        return (!department || specialty === department)
          && (!doctor || appointment.doctorName.toLowerCase().includes(doctor));
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  protected applyFilters(): void {
    // The getters derive the table from the current filter values.
  }

  protected statusLabel(status: Appointment['status']): string {
    switch (status) {
      case 'PENDING': return 'Awaiting Time';
      case 'CONFIRMED': return 'Confirmed';
      case 'REJECTED': return 'Declined';
      case 'CANCELED': return 'Canceled';
    }
  }

  /** Opens the inline time picker for a request that has no time yet. */
  protected openScheduler(appointment: Appointment): void {
    this.schedulingId.set(appointment.id);
    this.selectedTime = '';
    this.blockedTimesForScheduling.set(new Set());
    this.startTimeForScheduling.set(null);

    this.appointmentService.getUnavailableTimes(appointment.doctorId, appointment.date).subscribe({
      next: (taken) => this.mergeBlockedTimes(taken),
    });
    this.doctorEventService.getForDoctor(appointment.doctorId).subscribe({
      next: (events) => {
        const blockedOnDate = events
          .filter((event) => event.date === appointment.date)
          .map((event) => event.time)
          .filter((time): time is string => time !== null);
        this.mergeBlockedTimes(blockedOnDate);
      },
    });
    // The doctor's resolved start time for this date (their standing default, or a per-date
    // override — see DoctorDayOverride) — only times at or after it can be offered to a patient.
    this.appointmentService.getDaySummary(appointment.doctorId, appointment.date).subscribe({
      next: (summary) => this.startTimeForScheduling.set(summary.dailyStartTime),
    });
  }

  protected closeScheduler(): void {
    this.schedulingId.set(null);
    this.selectedTime = '';
  }

  protected isTimeBlocked(time: string): boolean {
    return this.blockedTimesForScheduling().has(time) || this.isBeforeStartTime(time);
  }

  protected isBeforeStartTime(time: string): boolean {
    const startTime = this.startTimeForScheduling();
    if (!startTime) {
      return false;
    }
    return this.timeSlots.indexOf(time) < this.timeSlots.indexOf(startTime);
  }

  protected confirmSchedule(appointment: Appointment): void {
    if (!this.selectedTime || this.submitting()) {
      return;
    }

    this.submitting.set(appointment.id);
    this.appointmentService.scheduleAppointment(appointment.id, this.selectedTime).subscribe({
      next: (updated) => {
        this.appointments.update((current) => current.filter((item) => item.id !== appointment.id));
        this.allAppointments.update((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        this.submitting.set(null);
        this.closeScheduler();
      },
      error: (error) => {
        this.loadError.set(error?.error?.message || 'Unable to schedule this appointment.');
        this.submitting.set(null);
      },
    });
  }

  protected decline(appointment: Appointment): void {
    this.updateStatus(appointment, 'REJECTED');
  }

  protected cancel(appointment: Appointment): void {
    this.updateStatus(appointment, 'CANCELED');
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
        this.allAppointments.set(appointments);
        this.appointments.set(appointments.filter((appointment) => appointment.status === 'PENDING'));
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load appointments right now.');
        this.isLoading.set(false);
      },
    });
  }

  private updateStatus(appointment: Appointment, status: 'REJECTED' | 'CANCELED'): void {
    if (this.submitting()) {
      return;
    }

    this.submitting.set(appointment.id);
    this.appointmentService.updateStatus(appointment.id, status).subscribe({
      next: (updated) => {
        this.appointments.update((current) => current.filter((item) => item.id !== appointment.id));
        this.allAppointments.update((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        this.submitting.set(null);
      },
      error: (error) => {
        this.loadError.set(error?.error?.message || 'Unable to update this appointment.');
        this.submitting.set(null);
      },
    });
  }

  private mergeBlockedTimes(times: string[]): void {
    this.blockedTimesForScheduling.update((current) => new Set([...current, ...times]));
  }
}
