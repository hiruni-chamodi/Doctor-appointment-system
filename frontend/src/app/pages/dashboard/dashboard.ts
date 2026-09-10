import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

interface BookingDay {
  label: string;
  percent: number;
  active?: boolean;
}

interface Doctor {
  name: string;
  specialty: string;
  initials: string;
}

interface DoctorRecord {
  id: string;
  fullName: string;
  specialty: string | null;
}

interface PatientRecord {
  id: string;
  fullName: string;
  email: string;
}

const DOCTORS_API_URL = 'http://localhost:8081/api/doctors';
const PATIENTS_API_URL = 'http://localhost:8081/api/patients';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  protected readonly doctorName: string;

  // todaysAppointments/appointmentsChange stay as placeholders — there's no
  // appointments/scheduling backend yet to source real numbers from.
  protected readonly stats = {
    todaysAppointments: 24,
    appointmentsChange: '+12% vs last week',
  };

  protected readonly totalPatients = signal<number | null>(null);

  protected readonly bookingTrends: BookingDay[] = [
    { label: 'Mon', percent: 45 },
    { label: 'Tue', percent: 65 },
    { label: 'Wed', percent: 100, active: true },
    { label: 'Thu', percent: 40 },
    { label: 'Fri', percent: 78 },
  ];

  protected readonly doctors = signal<Doctor[]>([]);

  constructor(
    private authService: AuthService,
    private http: HttpClient,
  ) {
    this.doctorName = this.authService.getCurrentUser()?.fullName ?? 'Doctor';
  }

  ngOnInit(): void {
    this.http.get<DoctorRecord[]>(DOCTORS_API_URL).subscribe({
      next: (records) => this.doctors.set(records.map((record) => this.toDoctor(record))),
      error: () => this.doctors.set([]),
    });

    this.http.get<PatientRecord[]>(PATIENTS_API_URL).subscribe({
      next: (patients) => this.totalPatients.set(patients.length),
      error: () => this.totalPatients.set(null),
    });
  }

  private toDoctor(record: DoctorRecord): Doctor {
    return {
      name: record.fullName,
      specialty: record.specialty || 'General',
      initials: this.getInitials(record.fullName),
    };
  }

  private getInitials(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0]?.charAt(0) ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  }
}
