import { Component, OnInit, signal } from '@angular/core';
import { Appointment, AppointmentService } from '../services/appointment.service';
import { AuthService } from '../services/auth.service';

type Tab = 'upcoming' | 'past' | 'canceled';

@Component({
  selector: 'app-my-appointments',
  imports: [],
  templateUrl: './my-appointments.html',
  styleUrl: './my-appointments.css',
})
export class MyAppointments implements OnInit {
  // Loaded from an HttpClient subscribe callback, so these are signals — this app runs
  // zoneless, and a plain field mutated outside a template-bound event handler won't
  // schedule a re-render.
  protected readonly appointments = signal<Appointment[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal('');

  protected activeTab: Tab = 'upcoming';

  private readonly todayIso = this.toIsoDate(new Date());

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const patient = this.authService.getCurrentUser();
    if (!patient) {
      this.isLoading.set(false);
      this.loadError.set('You must be signed in to view your appointments.');
      return;
    }

    this.appointmentService.getForPatient(patient.id).subscribe({
      next: (appointments) => {
        this.appointments.set(appointments);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load your appointments right now.');
        this.isLoading.set(false);
      },
    });
  }

  protected setTab(tab: Tab): void {
    this.activeTab = tab;
  }

  protected tabClasses(tab: Tab): string {
    const base = 'whitespace-nowrap py-4 px-1 text-sm border-b-2 transition';
    return this.activeTab === tab
      ? `${base} font-bold border-[#0A3F35] text-[#0A3F35]`
      : `${base} font-medium border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`;
  }

  protected get upcoming(): Appointment[] {
    return this.appointments().filter((a) => a.status !== 'REJECTED' && a.date >= this.todayIso);
  }

  protected get past(): Appointment[] {
    return this.appointments().filter((a) => a.status !== 'REJECTED' && a.date < this.todayIso);
  }

  protected get canceled(): Appointment[] {
    return this.appointments().filter((a) => a.status === 'REJECTED');
  }

  protected get visibleAppointments(): Appointment[] {
    if (this.activeTab === 'upcoming') return this.upcoming;
    if (this.activeTab === 'past') return this.past;
    return this.canceled;
  }

  protected dateParts(isoDate: string): { month: string; day: number; weekday: string } {
    // Parsed as local midnight rather than UTC, so the label doesn't shift a day off in
    // timezones behind UTC.
    const [year, month, day] = isoDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.getDate(),
      weekday: date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(),
    };
  }

  protected statusLabel(status: Appointment['status']): string {
    if (status === 'CONFIRMED') return 'Confirmed';
    if (status === 'REJECTED') return 'Declined';
    return 'Pending';
  }

  protected statusClasses(status: Appointment['status']): string {
    const base = 'px-3 py-1 rounded-full text-xs font-bold tracking-wide';
    if (status === 'CONFIRMED') return `${base} bg-emerald-100 text-emerald-800`;
    if (status === 'REJECTED') return `${base} bg-red-100 text-red-700`;
    return `${base} bg-orange-100 text-orange-800`;
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
