import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { AppointmentService } from '../services/appointment.service';
import { AuthService } from '../services/auth.service';
import { getInitials } from '../shared/initials';
import { BOOKABLE_TIME_SLOTS } from '../shared/time-slots';
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
  @Output() confirmed = new EventEmitter<{ doctorId: string; doctorName: string; date: string; time: string }>();

  protected readonly timeSlots = BOOKABLE_TIME_SLOTS;

  // These are read/written from HttpClient subscribe callbacks (not just template events), so
  // they're signals — this app runs zoneless, and a plain field mutated outside a template-bound
  // event handler won't schedule a re-render.
  protected readonly selectedTime = signal('');
  protected readonly unavailableTimes = signal(new Set<string>());
  protected readonly submitState = signal<SubmitState>('idle');
  protected readonly submitError = signal('');

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
    this.refreshUnavailableTimes();
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
    this.selectedTime.set('');
    this.buildCalendar();
    this.refreshUnavailableTimes();
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

  protected isSlotTaken(time: string): boolean {
    return this.unavailableTimes().has(time);
  }

  selectTime(time: string) {
    if (this.isSlotTaken(time)) {
      return;
    }
    this.selectedTime.set(time);
  }

  protected slotClasses(time: string): string {
    const base = 'py-2.5 rounded-xl font-medium transition text-sm';
    if (this.isSlotTaken(time)) {
      return `${base} border border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through`;
    }
    return time === this.selectedTime()
      ? `${base} border-2 border-[#0A3F35] bg-emerald-50 text-[#0A3F35] font-bold shadow-sm`
      : `${base} border border-gray-200 text-gray-700 hover:border-[#0A3F35] hover:text-[#0A3F35]`;
  }

  onClose() {
    this.closed.emit();
  }

  onConfirm() {
    const time = this.selectedTime();
    if (!time || this.submitState() === 'submitting') {
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

    this.appointmentService.create({ patientId: patient.id, doctorId: this.doctorId, date, time }).subscribe({
      next: () => {
        this.submitState.set('success');
        this.confirmed.emit({ doctorId: this.doctorId, doctorName: this.doctorName, date, time });
      },
      error: (err) => {
        this.submitState.set('error');
        this.submitError.set(err?.error?.message || 'Could not send the appointment request. Please try again.');
        // The failure may have been a just-taken slot — refresh so it greys out immediately.
        this.refreshUnavailableTimes();
      },
    });
  }

  private refreshUnavailableTimes(): void {
    this.appointmentService.getUnavailableTimes(this.doctorId, toIsoDate(this.selectedDate)).subscribe({
      next: (times) => {
        const taken = new Set(times);
        this.unavailableTimes.set(taken);
        if (this.selectedTime() && taken.has(this.selectedTime())) {
          this.selectedTime.set('');
        }
      },
      error: () => {
        // If we can't fetch what's taken, fall back to letting the user pick freely —
        // the backend still rejects a double-booked slot on submit.
        this.unavailableTimes.set(new Set());
      },
    });
  }

  private buildCalendar(): void {
    this.calendarWeeks = buildMonthGrid(this.viewYear, this.viewMonth, this.selectedDate, this.today);
  }
}
