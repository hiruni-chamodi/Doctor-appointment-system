import { Component } from '@angular/core';

interface CalendarDay {
  day: number;
  currentMonth: boolean;
  selected?: boolean;
}

interface WeekDay {
  label: string;
  date: number;
  active?: boolean;
}

interface OverviewStat {
  label: string;
  value: number;
  color: string;
}

interface Appointment {
  day: string;
  rowStart: number;
  rowSpan: number;
  patient: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  statusLabel?: string;
}

@Component({
  selector: 'app-schedule',
  standalone: true,
  templateUrl: './schedule.html',
  styleUrl: './schedule.css',
})
export class Schedule {
  protected readonly viewModes = ['Day', 'Week', 'Month'];
  protected activeView = 'Week';

  protected readonly monthLabel = 'October 2023';
  protected readonly weekdayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  protected readonly calendarWeeks: CalendarDay[][] = [
    [
      { day: 29, currentMonth: false },
      { day: 30, currentMonth: false },
      { day: 1, currentMonth: true },
      { day: 2, currentMonth: true },
      { day: 3, currentMonth: true },
      { day: 4, currentMonth: true },
      { day: 5, currentMonth: true },
    ],
    [
      { day: 6, currentMonth: true },
      { day: 7, currentMonth: true },
      { day: 8, currentMonth: true },
      { day: 9, currentMonth: true },
      { day: 10, currentMonth: true },
      { day: 11, currentMonth: true },
      { day: 12, currentMonth: true },
    ],
    [
      { day: 13, currentMonth: true },
      { day: 14, currentMonth: true },
      { day: 15, currentMonth: true },
      { day: 16, currentMonth: true },
      { day: 17, currentMonth: true },
      { day: 18, currentMonth: true },
      { day: 19, currentMonth: true },
    ],
    [
      { day: 20, currentMonth: true },
      { day: 21, currentMonth: true },
      { day: 22, currentMonth: true },
      { day: 23, currentMonth: true },
      { day: 24, currentMonth: true, selected: true },
      { day: 25, currentMonth: true },
      { day: 26, currentMonth: true },
    ],
    [
      { day: 27, currentMonth: true },
      { day: 28, currentMonth: true },
      { day: 29, currentMonth: true },
      { day: 30, currentMonth: true },
      { day: 31, currentMonth: true },
      { day: 1, currentMonth: false },
      { day: 2, currentMonth: false },
    ],
  ];

  protected readonly overviewStats: OverviewStat[] = [
    { label: 'Confirmed', value: 8, color: '#7fd8a6' },
    { label: 'Pending', value: 2, color: '#6b3f1d' },
    { label: 'Cancellations', value: 1, color: '#f5b8c4' },
  ];

  protected readonly weekDays: WeekDay[] = [
    { label: 'Mon', date: 24 },
    { label: 'Tue', date: 25, active: true },
    { label: 'Wed', date: 26 },
    { label: 'Thu', date: 27 },
    { label: 'Fri', date: 28 },
    { label: 'Sat', date: 29 },
    { label: 'Sun', date: 30 },
  ];

  protected readonly timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM'];

  protected readonly appointments: Appointment[] = [
    { day: 'Mon', rowStart: 0, rowSpan: 2, patient: 'Sarah J...', status: 'confirmed', statusLabel: 'Confirmed' },
    { day: 'Tue', rowStart: 1, rowSpan: 1, patient: 'Marcus ...', status: 'pending', statusLabel: 'Pending' },
    { day: 'Wed', rowStart: 2, rowSpan: 1, patient: 'Emily Che', status: 'cancelled' },
  ];

  protected setView(view: string): void {
    this.activeView = view;
  }

  protected dayColumn(day: string): number {
    return this.weekDays.findIndex((weekDay) => weekDay.label === day) + 2;
  }
}
