import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-booking-modal',
  imports: [],
  templateUrl: './booking-modal.html',
  styleUrl: './booking-modal.css',
})
export class BookingModal {
  @Input() doctorName = 'Dr. Sarah Jenkins';
  @Input() doctorRole = 'Cardiologist';

  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<{ doctorName: string; time: string }>();

  protected readonly timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '01:00 PM', '02:30 PM', '03:00 PM',
  ];
  protected selectedTime = '10:30 AM';

  protected get avatarUrl(): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.doctorName)}&background=e2e8f0&color=0f172a&size=128`;
  }

  selectTime(time: string) {
    this.selectedTime = time;
  }

  protected slotClasses(time: string): string {
    const base = 'py-2.5 rounded-xl font-medium transition text-sm';
    return time === this.selectedTime
      ? `${base} border-2 border-[#0A3F35] bg-emerald-50 text-[#0A3F35] font-bold shadow-sm`
      : `${base} border border-gray-200 text-gray-700 hover:border-[#0A3F35] hover:text-[#0A3F35]`;
  }

  onClose() {
    this.closed.emit();
  }

  onConfirm() {
    this.confirmed.emit({ doctorName: this.doctorName, time: this.selectedTime });
    this.closed.emit();
  }
}
