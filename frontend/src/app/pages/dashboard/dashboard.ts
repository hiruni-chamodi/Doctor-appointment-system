import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Appointment, AppointmentService } from '../../services/appointment.service';
import { ReminderService } from '../../services/reminder.service';
import { AppointmentRequestsModal } from '../../appointment-requests-modal/appointment-requests-modal';
import { getInitials } from '../../shared/initials';
import { stripTime, toIsoDate } from '../../shared/calendar-grid';

type ReminderState = 'idle' | 'sending' | 'sent' | 'error';

interface PatientSummary {
  id: string;
  name: string;
}

interface BookingDay {
  label: string;
  percent: number;
  active?: boolean;
}

interface Stats {
  todaysAppointments: number;
  appointmentsChange: string;
}

interface Doctor {
  name: string;
  specialty: string;
  initials: string;
}

interface DoctorRecord {
  id: string;
  fullName: string;
  specialty: string | null;
}

interface PatientRecord {
  id: string;
  fullName: string;
  email: string;
}

const DOCTORS_API_URL = 'http://localhost:8081/api/doctors';
const PATIENTS_API_URL = 'http://localhost:8081/api/patients';
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

/** Quick-pick messages for the reminder box, so the doctor isn't always typing one from scratch. */
const CANNED_REMINDER_MESSAGES = [
  "Don't forget your upcoming appointment.",
  'Please arrive 15 minutes early for your visit.',
  'Kindly bring your previous medical records or lab results.',
  'This is a reminder to take your prescribed medication as directed.',
  'Please confirm you can still make your upcoming appointment.',
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AppointmentRequestsModal, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  protected readonly doctorName: string;
  protected readonly doctorId: string;

  protected isRequestsModalOpen = false;

  // All read/written from HttpClient subscribe callbacks, so these are signals — this app runs
  // zoneless, and a plain field mutated outside a template-bound event handler won't schedule a
  // re-render.
  protected readonly pendingRequestCount = signal(0);
  protected readonly stats = signal<Stats>({ todaysAppointments: 0, appointmentsChange: 'Loading…' });
  protected readonly bookingTrends = signal<BookingDay[]>([]);
  protected readonly totalPatients = signal<number | null>(null);
  protected readonly doctors = signal<Doctor[]>([]);
  protected readonly myPatients = signal<PatientSummary[]>([]);

  // Send-a-reminder widget state. Selecting a patient and typing a message are synchronous,
  // template-event-driven changes, so they stay plain fields; only the send outcome (arriving
  // from an HttpClient subscribe callback) needs to be a signal.
  protected reminderSearchQuery = '';
  protected reminderDropdownOpen = false;
  protected selectedReminderPatient: PatientSummary | null = null;
  protected reminderMessage = '';
  protected readonly reminderState = signal<ReminderState>('idle');
  protected readonly reminderError = signal('');
  protected readonly cannedReminderMessages = CANNED_REMINDER_MESSAGES;

  private readonly today = stripTime(new Date());

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private appointmentService: AppointmentService,
    private reminderService: ReminderService,
  ) {
    const currentUser = this.authService.getCurrentUser();
    this.doctorName = currentUser?.fullName ?? 'Doctor';
    this.doctorId = currentUser?.id ?? '';
  }

  ngOnInit(): void {
    this.http.get<DoctorRecord[]>(DOCTORS_API_URL).subscribe({
      next: (records) => this.doctors.set(records.map((record) => this.toDoctor(record))),
      error: () => this.doctors.set([]),
    });

    this.http.get<PatientRecord[]>(PATIENTS_API_URL).subscribe({
      next: (patients) => this.totalPatients.set(patients.length),
      error: () => this.totalPatients.set(null),
    });

    this.refreshAppointmentData();
  }

  protected openRequestsModal(): void {
    this.isRequestsModalOpen = true;
  }

  protected closeRequestsModal(): void {
    this.isRequestsModalOpen = false;
    this.refreshAppointmentData();
  }

  protected refreshAppointmentData(): void {
    if (!this.doctorId) {
      return;
    }
    this.appointmentService.getForDoctor(this.doctorId).subscribe({
      next: (appointments) => {
        this.pendingRequestCount.set(appointments.filter((a) => a.status === 'PENDING').length);
        this.stats.set(this.computeStats(appointments));
        this.bookingTrends.set(this.computeBookingTrends(appointments));
        this.myPatients.set(this.uniquePatients(appointments));
      },
      error: () => {
        this.pendingRequestCount.set(0);
        this.stats.set({ todaysAppointments: 0, appointmentsChange: 'Unable to load' });
        this.bookingTrends.set([]);
      },
    });
  }

  /**
   * Patients this doctor has actually had a booking with, for the "Send Reminder" dropdown —
   * the full list when nothing's typed yet, filtered as the doctor types.
   */
  protected get visibleReminderPatients(): PatientSummary[] {
    const query = this.reminderSearchQuery.trim().toLowerCase();
    const list = query ? this.myPatients().filter((p) => p.name.toLowerCase().includes(query)) : this.myPatients();
    return list.slice(0, 8);
  }

  protected openReminderDropdown(): void {
    this.reminderDropdownOpen = true;
  }

  protected toggleReminderDropdown(): void {
    this.reminderDropdownOpen = !this.reminderDropdownOpen;
  }

  protected selectReminderPatient(patient: PatientSummary): void {
    this.selectedReminderPatient = patient;
    this.reminderSearchQuery = '';
    this.reminderDropdownOpen = false;
    this.reminderState.set('idle');
    this.reminderError.set('');
  }

  protected useCannedMessage(message: string): void {
    this.reminderMessage = message;
  }

  protected resetReminderForm(): void {
    this.selectedReminderPatient = null;
    this.reminderMessage = '';
    this.reminderDropdownOpen = false;
    this.reminderState.set('idle');
    this.reminderError.set('');
  }

  protected sendReminder(): void {
    const patient = this.selectedReminderPatient;
    const message = this.reminderMessage.trim();
    if (!patient || !message || this.reminderState() === 'sending') {
      return;
    }

    this.reminderState.set('sending');
    this.reminderError.set('');

    this.reminderService.create({ doctorId: this.doctorId, patientId: patient.id, message }).subscribe({
      next: () => this.reminderState.set('sent'),
      error: (err) => {
        this.reminderState.set('error');
        this.reminderError.set(err?.error?.message || 'Could not send the reminder. Please try again.');
      },
    });
  }

  private uniquePatients(appointments: Appointment[]): PatientSummary[] {
    const byId = new Map<string, string>();
    for (const appointment of appointments) {
      byId.set(appointment.patientId, appointment.patientName);
    }
    return Array.from(byId, ([id, name]) => ({ id, name }));
  }

  private computeStats(appointments: Appointment[]): Stats {
    const todayIso = toIsoDate(this.today);
    const lastWeek = new Date(this.today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekIso = toIsoDate(lastWeek);

    const todaysCount = appointments.filter((a) => a.status === 'CONFIRMED' && a.date === todayIso).length;
    const lastWeekCount = appointments.filter((a) => a.status === 'CONFIRMED' && a.date === lastWeekIso).length;

    let appointmentsChange: string;
    if (lastWeekCount === 0 && todaysCount === 0) {
      appointmentsChange = 'No appointments yet';
    } else if (lastWeekCount === 0) {
      appointmentsChange = 'New this week';
    } else {
      const percent = Math.round(((todaysCount - lastWeekCount) / lastWeekCount) * 100);
      appointmentsChange = `${percent > 0 ? '+' : ''}${percent}% vs same day last week`;
    }

    return { todaysAppointments: todaysCount, appointmentsChange };
  }

  /** Booking activity (pending + confirmed) for Mon-Fri of the current week, scaled to the busiest day. */
  private computeBookingTrends(appointments: Appointment[]): BookingDay[] {
    const active = appointments.filter((a) => a.status !== 'REJECTED');
    const todayIso = toIsoDate(this.today);

    const weekStart = new Date(this.today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const days = WEEKDAY_LABELS.map((label, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + 1 + i);
      const iso = toIsoDate(date);
      return { label, iso, count: active.filter((a) => a.date === iso).length };
    });

    const max = Math.max(...days.map((d) => d.count), 0);
    return days.map((d) => ({
      label: d.label,
      percent: max > 0 ? Math.round((d.count / max) * 100) : 0,
      active: d.iso === todayIso,
    }));
  }

  private toDoctor(record: DoctorRecord): Doctor {
    return {
      name: record.fullName,
      specialty: record.specialty || 'General',
      initials: getInitials(record.fullName),
    };
  }
}
