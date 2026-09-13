import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { AppointmentService, DoctorDaySummary } from '../services/appointment.service';
import { AuthService } from '../services/auth.service';
import { getInitials } from '../shared/initials';
import { buildMonthGrid, CalendarCell, stripTime, toIsoDate } from '../shared/calendar-grid';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

@Component({
  selector: 'app-booking-modal',
  imports: [],
  templateUrl: './booking-modal.html',
  styleUrl: './booking-modal.css',
})
export class BookingModal implements OnInit {
  @Input() doctorId = '';
  @Input() doctorName = 'Dr. Sarah Jenkins';
  @Input() doctorRole = 'Cardiologist';

  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<{ doctorId: string; doctorName: string; date: string }>();

  // These are read/written from HttpClient subscribe callbacks (not just template events), so
  // they're signals — this app runs zoneless, and a plain field mutated outside a template-bound
  // event handler won't schedule a re-render.
  protected readonly submitState = signal<SubmitState>('idle');
  protected readonly submitError = signal('');
  protected readonly daySummary = signal<DoctorDaySummary | null>(null);
  protected readonly isLoadingDaySummary = signal(true);

  protected selectedDate = stripTime(new Date());
  protected viewYear = this.selectedDate.getFullYear();
  protected viewMonth = this.selectedDate.getMonth();
  protected calendarWeeks: CalendarCell[][] = [];

  private readonly today = stripTime(new Date());

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.buildCalendar();
    this.refreshDaySummary();
  }

  protected get monthLabel(): string {
    return `${MONTH_NAMES[this.viewMonth]} ${this.viewYear}`;
  }

  protected get selectedDateLabel(): string {
    return this.selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  protected get avatarInitials(): string {
    return getInitials(this.doctorName);
  }

  /** Whether this date can still be requested — fully booked or doctor-blocked days can't.
   *  A failed availability check (summary === null after loading) doesn't block the request —
   *  the backend still enforces capacity/blocks on submit either way. */
  protected get canRequestDate(): boolean {
    if (this.isLoadingDaySummary()) {
      return false;
    }
    const summary = this.daySummary();
    return !summary || (!summary.blockedAllDay && summary.remaining > 0);
  }

  protected get availabilityMessage(): string {
    if (this.isLoadingDaySummary()) {
      return 'Checking availability…';
    }
    const summary = this.daySummary();
    if (!summary) {
      return '';
    }
    if (summary.blockedAllDay) {
      return `${this.doctorName} is unavailable on this date.`;
    }
    if (summary.remaining <= 0) {
      return `${this.doctorName} is fully booked on this date — try another day.`;
    }
    return `${summary.remaining} of ${summary.maxPatientsPerDay} spot${summary.maxPatientsPerDay === 1 ? '' : 's'} left on this date.`;
  }

  protected prevMonth(): void {
    this.viewMonth -= 1;
    if (this.viewMonth < 0) {
      this.viewMonth = 11;
      this.viewYear -= 1;
    }
    this.buildCalendar();
  }

  protected nextMonth(): void {
    this.viewMonth += 1;
    if (this.viewMonth > 11) {
      this.viewMonth = 0;
      this.viewYear += 1;
    }
    this.buildCalendar();
  }

  protected selectDate(cell: CalendarCell): void {
    if (!cell.date || cell.isPast) {
      return;
    }
    this.selectedDate = cell.date;
    this.buildCalendar();
    this.refreshDaySummary();
  }

  protected dayClasses(cell: CalendarCell): string {
    const base = 'w-10 h-10 rounded-full flex items-center justify-center transition font-medium';
    if (cell.isPast) {
      return `${base} text-gray-300 cursor-not-allowed`;
    }
    if (cell.isSelected) {
      return `${base} bg-[#0A3F35] text-white font-bold shadow-md`;
    }
    if (cell.isToday) {
      return `${base} ring-1 ring-[#0A3F35] hover:bg-gray-100`;
    }
    return `${base} hover:bg-gray-100`;
  }

  onClose() {
    this.closed.emit();
  }

  onConfirm() {
    if (!this.canRequestDate || this.submitState() === 'submitting') {
      return;
    }

    const patient = this.authService.getCurrentUser();
    if (!patient) {
      this.submitState.set('error');
      this.submitError.set('You must be signed in to book an appointment.');
      return;
    }

    const date = toIsoDate(this.selectedDate);

    this.submitState.set('submitting');
    this.submitError.set('');

    this.appointmentService.create({ patientId: patient.id, doctorId: this.doctorId, date }).subscribe({
      next: () => {
        this.submitState.set('success');
        this.confirmed.emit({ doctorId: this.doctorId, doctorName: this.doctorName, date });
      },
      error: (err) => {
        this.submitState.set('error');
        this.submitError.set(err?.error?.message || 'Could not send the appointment request. Please try again.');
        // The failure may have been a just-filled day — refresh so the message updates.
        this.refreshDaySummary();
      },
    });
  }

  private refreshDaySummary(): void {
    this.isLoadingDaySummary.set(true);
    this.appointmentService.getDaySummary(this.doctorId, toIsoDate(this.selectedDate)).subscribe({
      next: (summary) => {
        this.daySummary.set(summary);
        this.isLoadingDaySummary.set(false);
      },
      error: () => {
        // If we can't check availability, fall back to letting the request through —
        // the backend still enforces capacity/blocks on submit.
        this.daySummary.set(null);
        this.isLoadingDaySummary.set(false);
      },
    });
  }

  private buildCalendar(): void {
    this.calendarWeeks = buildMonthGrid(this.viewYear, this.viewMonth, this.selectedDate, this.today);
  }
}
