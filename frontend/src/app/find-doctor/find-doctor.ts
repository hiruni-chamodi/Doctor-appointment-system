import { Component } from '@angular/core';
import { BookingModal } from '../booking-modal/booking-modal';

@Component({
  selector: 'app-find-doctor',
  imports: [BookingModal],
  templateUrl: './find-doctor.html',
  styleUrl: './find-doctor.css',
})
export class FindDoctor {
  protected isBookingModalOpen = false;
  protected selectedDoctorName = '';
  protected selectedDoctorRole = '';

  openBookingModal(doctorName: string, doctorRole: string) {
    this.selectedDoctorName = doctorName;
    this.selectedDoctorRole = doctorRole;
    this.isBookingModalOpen = true;
  }

  closeBookingModal() {
    this.isBookingModalOpen = false;
  }
}
