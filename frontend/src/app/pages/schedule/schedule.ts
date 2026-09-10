import { Component, OnInit, signal } from '@angular/core';
import { Appointment, AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { BOOKABLE_TIME_SLOTS } from '../../shared/time-slots';
import { buildMonthGrid, CalendarCell, stripTime, toIsoDate } from '../../shared/calendar-grid';

type ViewMode = 'Day' | 'Week' | 'Month';

interface WeekDay {
  label: string;
  date: number;
  iso: string;
  active: boolean;
}

interface OverviewStat {
  label: string;
  value: number;
  color: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

@Component({
  selector: 'app-schedule',
  standalone: true,
  templateUrl: './schedule.html',
  styleUrl: './schedule.css',
})
export class Schedule implements OnInit {
  protected readonly viewModes: ViewMode[] = ['Day', 'Week', 'Month'];
  protected activeView: ViewMode = 'Week';

  protected readonly weekdayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  protected readonly timeSlots = BOOKABLE_TIME_SLOTS;

  protected weekDays: WeekDay[] = [];
  protected weekRangeLabel = '';
  protected dayLabel = '';
  protected monthLabel = '';
  protected calendarWeeks: CalendarCell[][] = [];

  // Loaded from an HttpClient subscribe callback, so this is a signal — this app runs
  // zoneless, and a plain field mutated outside a template-bound event handler won't
  // schedule a re-render.
  protected readonly appointments = signal<Appointment[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal('');

  private readonly today = stripTime(new Date());
  private anchorDate = this.today;

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.recompute();

    const doctor = this.authService.getCurrentUser();
    if (!doctor) {
      this.isLoading.set(false);
      this.loadError.set('You must be signed in to view your schedule.');
      return;
    }

    this.appointmentService.getForDoctor(doctor.id).subscribe({
      next: (appointments) => {
        this.appointments.set(appointments);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load your schedule right now.');
        this.isLoading.set(false);
      },
    });
  }

  protected setView(view: ViewMode): void {
    this.activeView = view;
  }

  protected get anchorIso(): string {
    return toIsoDate(this.anchorDate);
  }

  protected get periodLabel(): string {
    if (this.activeView === 'Day') return this.dayLabel;
    if (this.activeView === 'Month') return this.monthLabel;
    return this.weekRangeLabel;
  }

  protected goToday(): void {
    this.anchorDate = this.today;
    this.recompute();
  }

  protected goPrev(): void {
    this.shiftAnchor(-1);
  }

  protected goNext(): void {
    this.shiftAnchor(1);
  }

  /** Jump the current view to the clicked date, from the sidebar mini calendar. */
  protected selectMiniDay(cell: CalendarCell): void {
    if (!cell.date) {
      return;
    }
    this.anchorDate = cell.date;
    this.recompute();
  }

  /** Drill from the month grid into a single day. */
  protected selectMonthDay(cell: CalendarCell): void {
    if (!cell.date) {
      return;
    }
    this.anchorDate = cell.date;
    this.activeView = 'Day';
    this.recompute();
  }

  /** This week's confirmed/pending appointments that land on one of the fixed bookable time slots. */
  protected get weekAppointments(): Appointment[] {
    const isoDays = new Set(this.weekDays.map((d) => d.iso));
    return this.appointments().filter(
      (a) => a.status !== 'REJECTED' && isoDays.has(a.date) && this.timeSlots.includes(a.time),
    );
  }

  protected appointmentAt(iso: string, time: string): Appointment | undefined {
    return this.appointments().find((a) => a.status !== 'REJECTED' && a.date === iso && a.time === time);
  }

  protected isoOf(cell: CalendarCell): string {
    return cell.date ? toIsoDate(cell.date) : '';
  }

  protected appointmentsOn(iso: string): Appointment[] {
    return this.appointments()
      .filter((a) => a.status !== 'REJECTED' && a.date === iso)
      .sort((a, b) => this.timeSlots.indexOf(a.time) - this.timeSlots.indexOf(b.time));
  }

  protected get overviewStats(): OverviewStat[] {
    const isoDays = new Set(this.weekDays.map((d) => d.iso));
    const week = this.appointments().filter((a) => isoDays.has(a.date));
    return [
      { label: 'Confirmed', value: week.filter((a) => a.status === 'CONFIRMED').length, color: '#7fd8a6' },
      { label: 'Pending', value: week.filter((a) => a.status === 'PENDING').length, color: '#6b3f1d' },
      { label: 'Declined', value: week.filter((a) => a.status === 'REJECTED').length, color: '#f5b8c4' },
    ];
  }

  protected dayColumn(iso: string): number {
    return this.weekDays.findIndex((d) => d.iso === iso) + 2;
  }

  protected rowForTime(time: string): number {
    return this.timeSlots.indexOf(time);
  }

  private shiftAnchor(direction: number): void {
    const next = new Date(this.anchorDate);
    if (this.activeView === 'Day') {
      next.setDate(next.getDate() + direction);
    } else if (this.activeView === 'Week') {
      next.setDate(next.getDate() + direction * 7);
    } else {
      next.setMonth(next.getMonth() + direction);
    }
    this.anchorDate = stripTime(next);
    this.recompute();
  }

  private recompute(): void {
    this.buildDay();
    this.buildWeek();
    this.buildMonth();
  }

  private startOfWeek(date: Date): Date {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    return start;
  }

  private buildDay(): void {
    this.dayLabel = this.anchorDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  private buildWeek(): void {
    const weekStart = this.startOfWeek(this.anchorDate);
    this.weekDays = WEEKDAY_LABELS.map((label, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      return {
        label,
        date: date.getDate(),
        iso: toIsoDate(date),
        active: date.getTime() === this.today.getTime(),
      };
    });

    const endDate = new Date(weekStart);
    endDate.setDate(endDate.getDate() + 6);
    const startLabel = `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getDate()}`;
    const endLabel =
      endDate.getMonth() === weekStart.getMonth()
        ? `${endDate.getDate()}`
        : `${MONTH_NAMES[endDate.getMonth()]} ${endDate.getDate()}`;
    this.weekRangeLabel = `${startLabel} - ${endLabel}`;
  }

  private buildMonth(): void {
    this.monthLabel = `${MONTH_NAMES[this.anchorDate.getMonth()]} ${this.anchorDate.getFullYear()}`;
    this.calendarWeeks = buildMonthGrid(
      this.anchorDate.getFullYear(),
      this.anchorDate.getMonth(),
      this.anchorDate,
      this.today,
    );
  }
}
