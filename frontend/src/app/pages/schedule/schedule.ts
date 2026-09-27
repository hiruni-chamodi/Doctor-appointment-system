import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Appointment, AppointmentService, DoctorDaySummary } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { DoctorEvent, DoctorEventService } from '../../services/doctor-event.service';
import { DoctorDayOverrideService } from '../../services/doctor-day-override.service';
import { ScheduleViewStateService } from '../../services/schedule-view-state.service';
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
  imports: [FormsModule],
  templateUrl: './schedule.html',
  styleUrl: './schedule.css',
})
export class Schedule implements OnInit {
  protected readonly viewModes: ViewMode[] = ['Day', 'Week', 'Month'];
  protected activeView: ViewMode;

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

  // Doctor-blocked calendar slots ("special events" — leave, a meeting, etc).
  protected readonly events = signal<DoctorEvent[]>([]);
  protected readonly isAddingEvent = signal(false);
  protected readonly isSavingEvent = signal(false);
  protected readonly eventFormError = signal('');
  protected eventTitle = '';
  protected eventDate = '';
  protected eventAllDay = true;
  protected eventTime = this.timeSlots[0];

  // Resolved settings (override if one exists for this date, otherwise the standing default)
  // for whichever date is currently in view.
  protected readonly daySummary = signal<DoctorDaySummary | null>(null);

  // Per-date start time / patient capacity override (see DoctorDayOverrideService).
  protected readonly isEditingCapacity = signal(false);
  protected readonly isSavingCapacity = signal(false);
  protected readonly capacityFormError = signal('');
  protected readonly hasOverrideForDay = signal(false);
  protected capacityStartTime = this.timeSlots[0];
  protected capacityMaxPatients = 8;

  private readonly today = stripTime(new Date());
  private anchorDate: Date;
  private doctorId = '';

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private doctorEventService: DoctorEventService,
    private doctorDayOverrideService: DoctorDayOverrideService,
    private router: Router,
    private viewState: ScheduleViewStateService,
  ) {
    // Restore whichever date/view the doctor last had open (see ScheduleViewStateService) —
    // this component gets torn down and rebuilt every time they navigate away and back
    // (e.g. to add a medical record), so without this it would silently snap back to
    // today's Week view and make other appointments look like they'd disappeared.
    this.activeView = this.viewState.activeView;
    this.anchorDate = this.viewState.anchorIso ? stripTime(new Date(this.viewState.anchorIso)) : this.today;
  }

  ngOnInit(): void {
    this.recompute();

    const doctor = this.authService.getCurrentUser();
    if (!doctor) {
      this.isLoading.set(false);
      this.loadError.set('You must be signed in to view your schedule.');
      return;
    }

    this.doctorId = doctor.id;
    this.refreshDaySummary();

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

    this.doctorEventService.getForDoctor(doctor.id).subscribe({
      next: (events) => this.events.set(events),
    });
  }

  protected setView(view: ViewMode): void {
    this.activeView = view;
    this.viewState.activeView = view;
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
    this.setAnchor(this.today);
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
    this.setAnchor(cell.date);
    this.recompute();
  }

  /** Drill from the month grid into a single day. */
  protected selectMonthDay(cell: CalendarCell): void {
    if (!cell.date) {
      return;
    }
    this.setAnchor(cell.date);
    this.activeView = 'Day';
    this.viewState.activeView = 'Day';
    this.recompute();
  }

  /** This week's confirmed/pending appointments that land on one of the fixed bookable time slots.
   *  A request an admin hasn't assigned a time to yet (time === null) has no slot to render in. */
  protected get weekAppointments(): (Appointment & { time: string })[] {
    const isoDays = new Set(this.weekDays.map((d) => d.iso));
    return this.appointments().filter(
      (a): a is Appointment & { time: string } =>
        a.status !== 'REJECTED' && isoDays.has(a.date) && a.time !== null && this.timeSlots.includes(a.time),
    );
  }

  protected appointmentAt(iso: string, time: string): Appointment | undefined {
    return this.appointments().find((a) => a.status !== 'REJECTED' && a.date === iso && a.time === time);
  }

  /** This week's whole-day blocks, each spanning every time row in its day's column. */
  protected get weekWholeDayEvents(): { event: DoctorEvent; iso: string }[] {
    const isoDays = new Set(this.weekDays.map((d) => d.iso));
    return this.events()
      .filter((e) => e.time === null && isoDays.has(e.date))
      .map((event) => ({ event, iso: event.date }));
  }

  /** This week's single-slot blocks, placed in the grid the same way an appointment card is. */
  protected get weekTimedEvents(): (DoctorEvent & { time: string })[] {
    const isoDays = new Set(this.weekDays.map((d) => d.iso));
    return this.events().filter(
      (e): e is DoctorEvent & { time: string } => e.time !== null && isoDays.has(e.date) && this.timeSlots.includes(e.time),
    );
  }

  protected isoOf(cell: CalendarCell): string {
    return cell.date ? toIsoDate(cell.date) : '';
  }

  /** Scheduled appointments on a date, in time order. Unscheduled requests (time === null) have no slot yet. */
  protected appointmentsOn(iso: string): Appointment[] {
    return this.appointments()
      .filter((a): a is Appointment & { time: string } => a.status !== 'REJECTED' && a.date === iso && a.time !== null)
      .sort((a, b) => this.timeSlots.indexOf(a.time) - this.timeSlots.indexOf(b.time));
  }

  /** Combined, capacity-ordered chips for a month cell: a whole-day block wins outright, otherwise
   *  blocked slots are shown alongside that day's scheduled appointments. */
  protected monthCellChips(iso: string): { label: string; kind: 'confirmed' | 'pending' | 'blocked' }[] {
    if (this.isDayBlocked(iso)) {
      return [{ label: 'Unavailable', kind: 'blocked' }];
    }
    const eventChips = this.eventsOn(iso).map((e) => ({ label: `${e.time} ${e.title}`, kind: 'blocked' as const }));
    const apptChips = this.appointmentsOn(iso).map((a) => ({
      label: `${a.time} ${a.patientName}`,
      kind: (a.status === 'CONFIRMED' ? 'confirmed' : 'pending') as 'confirmed' | 'pending',
    }));
    return [...eventChips, ...apptChips];
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

  /** Jump to the Medical Records page with this appointment's patient pre-selected, ready for the doctor to add a report. */
  protected addRecordFor(appt: Appointment, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/records'], {
      queryParams: { patientId: appt.patientId, patientName: appt.patientName },
    });
  }

  /** Special events (leave, meetings, etc) blocking a date — a null time means the whole day is blocked. */
  protected eventsOn(iso: string): DoctorEvent[] {
    return this.events().filter((e) => e.date === iso);
  }

  protected isDayBlocked(iso: string): boolean {
    return this.eventsOn(iso).some((e) => e.time === null);
  }

  /** The event covering this exact time slot — either one blocking just that slot, or a whole-day block. */
  protected eventAt(iso: string, time: string): DoctorEvent | undefined {
    return this.eventsOn(iso).find((e) => e.time === null || e.time === time);
  }

  protected openAddEvent(): void {
    this.eventTitle = '';
    this.eventDate = this.anchorIso;
    this.eventAllDay = true;
    this.eventTime = this.timeSlots[0];
    this.eventFormError.set('');
    this.isAddingEvent.set(true);
  }

  protected closeAddEvent(): void {
    this.isAddingEvent.set(false);
  }

  protected submitEvent(): void {
    if (!this.eventTitle.trim() || !this.eventDate || this.isSavingEvent()) {
      return;
    }

    this.isSavingEvent.set(true);
    this.eventFormError.set('');

    this.doctorEventService
      .create({
        doctorId: this.doctorId,
        date: this.eventDate,
        time: this.eventAllDay ? null : this.eventTime,
        title: this.eventTitle.trim(),
      })
      .subscribe({
        next: (created) => {
          this.events.update((list) => [...list, created]);
          this.isSavingEvent.set(false);
          this.isAddingEvent.set(false);
        },
        error: (err) => {
          this.isSavingEvent.set(false);
          this.eventFormError.set(err?.error?.message || 'Unable to save this event right now.');
        },
      });
  }

  protected deleteEvent(doctorEvent: DoctorEvent, domEvent: Event): void {
    domEvent.stopPropagation();
    this.doctorEventService.delete(doctorEvent.id).subscribe({
      next: () => this.events.update((list) => list.filter((e) => e.id !== doctorEvent.id)),
    });
  }

  /** Opens the "Day Capacity" editor for whichever date is currently in view — pre-filled with
   *  that date's override if one exists, otherwise the resolved (standing-default) values. */
  protected openCapacityEditor(): void {
    const summary = this.daySummary();
    this.capacityStartTime = summary?.dailyStartTime || this.timeSlots[0];
    this.capacityMaxPatients = summary?.maxPatientsPerDay || 8;
    this.capacityFormError.set('');
    this.hasOverrideForDay.set(false);
    this.isEditingCapacity.set(true);

    this.doctorDayOverrideService.get(this.doctorId, this.anchorIso).subscribe({
      next: (override) => {
        this.capacityStartTime = override.startTime;
        this.capacityMaxPatients = override.maxPatients;
        this.hasOverrideForDay.set(true);
      },
      error: () => {
        // No override set for this date — the resolved (standing-default) values above stand.
      },
    });
  }

  protected closeCapacityEditor(): void {
    this.isEditingCapacity.set(false);
  }

  protected submitCapacity(): void {
    if (!this.capacityStartTime || this.capacityMaxPatients < 1 || this.isSavingCapacity()) {
      return;
    }

    this.isSavingCapacity.set(true);
    this.capacityFormError.set('');

    this.doctorDayOverrideService
      .upsert(this.doctorId, this.anchorIso, {
        startTime: this.capacityStartTime,
        maxPatients: this.capacityMaxPatients,
      })
      .subscribe({
        next: () => {
          this.isSavingCapacity.set(false);
          this.hasOverrideForDay.set(true);
          this.isEditingCapacity.set(false);
          this.refreshDaySummary();
        },
        error: (err) => {
          this.isSavingCapacity.set(false);
          this.capacityFormError.set(err?.error?.message || 'Unable to save this override right now.');
        },
      });
  }

  /** Reverts the currently-viewed date back to the doctor's standing default. */
  protected removeCapacityOverride(): void {
    if (this.isSavingCapacity()) {
      return;
    }
    this.isSavingCapacity.set(true);
    this.doctorDayOverrideService.delete(this.doctorId, this.anchorIso).subscribe({
      next: () => {
        this.isSavingCapacity.set(false);
        this.isEditingCapacity.set(false);
        this.refreshDaySummary();
      },
      error: () => {
        this.isSavingCapacity.set(false);
      },
    });
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
    this.setAnchor(stripTime(next));
    this.recompute();
  }

  private setAnchor(date: Date): void {
    this.anchorDate = date;
    this.viewState.anchorIso = toIsoDate(date);
    this.refreshDaySummary();
  }

  private refreshDaySummary(): void {
    if (!this.doctorId) {
      return;
    }
    this.appointmentService.getDaySummary(this.doctorId, this.anchorIso).subscribe({
      next: (summary) => this.daySummary.set(summary),
      error: () => this.daySummary.set(null),
    });
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
