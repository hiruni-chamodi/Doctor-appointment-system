import { Component, OnInit, signal } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Reminder, ReminderService } from '../services/reminder.service';
import { BookingModal } from '../booking-modal/booking-modal';

@Component({
  selector: 'app-patient-dashboard',
  imports: [BookingModal],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.css',
})
export class PatientDashboardComponent implements OnInit {
  protected readonly profileName: string;

  protected isBookingModalOpen = false;
  protected selectedDoctorName = '';
  protected selectedDoctorRole = '';

  // Loaded from an HttpClient subscribe callback, so this is a signal — this app runs
  // zoneless, and a plain field mutated outside a template-bound event handler won't
  // schedule a re-render.
  protected readonly reminders = signal<Reminder[]>([]);

  private readonly patientId: string;

  openBookingModal(doctorName: string, doctorRole: string) {
    this.selectedDoctorName = doctorName;
    this.selectedDoctorRole = doctorRole;
    this.isBookingModalOpen = true;
  }

  closeBookingModal() {
    this.isBookingModalOpen = false;
  }

  constructor(
    private authService: AuthService,
    private reminderService: ReminderService,
  ) {
    const patient = this.authService.getCurrentUser();
    this.profileName = patient?.fullName ?? 'Patient';
    this.patientId = patient?.id ?? '';
  }

  ngOnInit(): void {
    if (!this.patientId) {
      return;
    }
    this.reminderService.getForPatient(this.patientId).subscribe({
      next: (reminders) => this.reminders.set(reminders.filter((r) => !r.read)),
      error: () => this.reminders.set([]),
    });
  }

  protected dismissReminder(reminder: Reminder): void {
    this.reminders.update((list) => list.filter((r) => r.id !== reminder.id));
    this.reminderService.markRead(reminder.id).subscribe({
      error: () => {
        // Best-effort — if this fails the reminder just reappears on next load, no need to
        // surface an error for a "dismiss" action.
      },
    });
  }
}
