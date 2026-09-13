import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Reminder, ReminderService } from '../services/reminder.service';
import { MedicalRecord, MedicalRecordService } from '../services/medical-record.service';
import { Appointment, AppointmentService } from '../services/appointment.service';
import { BookingModal } from '../booking-modal/booking-modal';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

interface DoctorSummary {
  id: string;
  fullName: string;
  specialty: string | null;
}

const DOCTORS_API_URL = 'http://localhost:8081/api/doctors';

@Component({
  selector: 'app-patient-dashboard',
  imports: [BookingModal, DatePipe, RouterLink],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.css',
})
export class PatientDashboardComponent implements OnInit {
  protected readonly profileName: string;

  protected isBookingModalOpen = false;
  protected selectedDoctorId = '';
  protected selectedDoctorName = '';
  protected selectedDoctorRole = '';

  // Loaded from an HttpClient subscribe callback, so this is a signal — this app runs
  // zoneless, and a plain field mutated outside a template-bound event handler won't
  // schedule a re-render.
  protected readonly reminders = signal<Reminder[]>([]);
  protected readonly medicalRecords = signal<MedicalRecord[]>([]);
  protected readonly latestRecord = signal<MedicalRecord | null>(null);
  protected readonly upcomingAppointments = signal<Appointment[]>([]);
  protected readonly doctors = signal<DoctorSummary[]>([]);

  private readonly patientId: string;

  openBookingModal(doctorId: string, doctorName: string, doctorRole: string) {
    this.selectedDoctorId = doctorId;
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
    private medicalRecordService: MedicalRecordService,
    private appointmentService: AppointmentService,
    private http: HttpClient,
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
    this.medicalRecordService.getPatientRecords(this.patientId).subscribe({
      next: (records) => {
        const sortedRecords = [...records].sort(
          (a, b) => Date.parse(b.dateRecorded) - Date.parse(a.dateRecorded),
        );
        this.medicalRecords.set(sortedRecords);
        this.latestRecord.set(sortedRecords[0] ?? null);
      },
      error: () => {
        this.medicalRecords.set([]);
        this.latestRecord.set(null);
      },
    });
    this.appointmentService.getForPatient(this.patientId).subscribe({
      next: (appointments) => {
        const upcoming = appointments
          .filter((appointment) => appointment.status === 'PENDING' || appointment.status === 'CONFIRMED')
          .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
        this.upcomingAppointments.set(upcoming);
      },
      error: () => this.upcomingAppointments.set([]),
    });
    this.http.get<DoctorSummary[]>(DOCTORS_API_URL).subscribe({
      next: (doctors) => this.doctors.set(doctors),
      error: () => this.doctors.set([]),
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
