import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Appointment, AppointmentService } from '../services/appointment.service';

/** Quick-pick reasons a doctor can send when declining a request, instead of typing one each time. */
export const CANNED_REJECTION_REASONS = [
  "I'm not available at that time.",
  'Fully booked that day — please choose another date.',
  'This appointment requires an in-person visit first.',
  'Outside of clinic hours.',
];

const OTHER_REASON_OPTION = 'Other';

interface RequestView {
  appointment: Appointment;
  isRejecting: boolean;
  reasonOption: string;
  customReason: string;
  isSubmitting: boolean;
  error: string;
}

@Component({
  selector: 'app-appointment-requests-modal',
  imports: [FormsModule],
  templateUrl: './appointment-requests-modal.html',
  styleUrl: './appointment-requests-modal.css',
})
export class AppointmentRequestsModal implements OnInit {
  @Input() doctorId = '';

  @Output() closed = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  protected readonly cannedReasons = CANNED_REJECTION_REASONS;
  protected readonly otherReasonOption = OTHER_REASON_OPTION;

  // All read/written from HttpClient subscribe callbacks, so these are signals — this app runs
  // zoneless, and a plain field mutated outside a template-bound event handler won't schedule a
  // re-render, which is why this modal used to get stuck on "Loading requests…" forever even
  // though the data had already arrived.
  protected readonly requests = signal<RequestView[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal('');

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  protected onClose(): void {
    this.closed.emit();
  }

  protected formatDate(isoDate: string): string {
    // Parsed as local midnight rather than UTC, so the label doesn't shift a day off in
    // timezones behind UTC.
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  private loadRequests(): void {
    this.isLoading.set(true);
    this.loadError.set('');
    this.appointmentService.getForDoctor(this.doctorId, 'PENDING').subscribe({
      next: (appointments) => {
        this.requests.set(appointments.map((appointment) => this.toView(appointment)));
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load appointment requests right now.');
        this.isLoading.set(false);
      },
    });
  }

  private toView(appointment: Appointment): RequestView {
    return {
      appointment,
      isRejecting: false,
      reasonOption: this.cannedReasons[0],
      customReason: '',
      isSubmitting: false,
      error: '',
    };
  }

  protected accept(view: RequestView): void {
    if (view.isSubmitting) {
      return;
    }
    const id = view.appointment.id;
    this.patchRequest(id, { isSubmitting: true, error: '' });
    this.appointmentService.accept(id).subscribe({
      next: () => {
        this.removeRequest(id);
        this.updated.emit();
      },
      error: (err) => {
        this.patchRequest(id, {
          isSubmitting: false,
          error: err?.error?.message || 'Could not accept this request. Please try again.',
        });
      },
    });
  }

  protected startReject(view: RequestView): void {
    this.patchRequest(view.appointment.id, { isRejecting: true, error: '' });
  }

  protected cancelReject(view: RequestView): void {
    this.patchRequest(view.appointment.id, { isRejecting: false, error: '' });
  }

  protected submitReject(view: RequestView): void {
    if (view.isSubmitting) {
      return;
    }
    const reason = view.reasonOption === OTHER_REASON_OPTION ? view.customReason.trim() : view.reasonOption;
    if (!reason) {
      this.patchRequest(view.appointment.id, { error: 'Please write a reason for the patient.' });
      return;
    }

    const id = view.appointment.id;
    this.patchRequest(id, { isSubmitting: true, error: '' });
    this.appointmentService.reject(id, reason).subscribe({
      next: () => {
        this.removeRequest(id);
        this.updated.emit();
      },
      error: (err) => {
        this.patchRequest(id, {
          isSubmitting: false,
          error: err?.error?.message || 'Could not decline this request. Please try again.',
        });
      },
    });
  }

  private patchRequest(appointmentId: string, patch: Partial<RequestView>): void {
    this.requests.update((list) =>
      list.map((view) => (view.appointment.id === appointmentId ? { ...view, ...patch } : view)),
    );
  }

  private removeRequest(appointmentId: string): void {
    this.requests.update((list) => list.filter((view) => view.appointment.id !== appointmentId));
  }
}
