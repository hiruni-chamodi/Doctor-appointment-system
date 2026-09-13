import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BookingModal } from '../booking-modal/booking-modal';
import { getInitials } from '../shared/initials';

interface DoctorRecord {
  id: string;
  fullName: string;
  specialty: string | null;
}

const DOCTORS_API_URL = 'http://localhost:8081/api/doctors';

@Component({
  selector: 'app-find-doctor',
  imports: [BookingModal, FormsModule],
  templateUrl: './find-doctor.html',
  styleUrl: './find-doctor.css',
})
export class FindDoctor implements OnInit {
  // Loaded from an HttpClient subscribe callback, so these are signals — this app runs
  // zoneless, and a plain field mutated outside a template-bound event handler won't
  // schedule a re-render.
  protected readonly doctors = signal<DoctorRecord[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal('');

  protected searchQuery = '';

  protected isBookingModalOpen = false;
  protected selectedDoctorId = '';
  protected selectedDoctorName = '';
  protected selectedDoctorRole = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<DoctorRecord[]>(DOCTORS_API_URL).subscribe({
      next: (doctors) => {
        this.doctors.set(doctors);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load doctors right now. Please try again later.');
        this.isLoading.set(false);
      },
    });
  }

  get filteredDoctors(): DoctorRecord[] {
    const query = this.searchQuery.trim().toLowerCase();
    const doctors = this.doctors();
    if (!query) {
      return doctors;
    }
    return doctors.filter(
      (doctor) =>
        doctor.fullName.toLowerCase().includes(query) || (doctor.specialty ?? '').toLowerCase().includes(query),
    );
  }

  avatarInitials(name: string): string {
    return getInitials(name);
  }

  openBookingModal(doctor: DoctorRecord): void {
    this.selectedDoctorId = doctor.id;
    this.selectedDoctorName = doctor.fullName;
    this.selectedDoctorRole = doctor.specialty || 'General Practice';
    this.isBookingModalOpen = true;
  }

  closeBookingModal(): void {
    this.isBookingModalOpen = false;
  }
}
