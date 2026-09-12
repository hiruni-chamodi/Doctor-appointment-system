import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { MedicalRecord, MedicalRecordService } from '../services/medical-record.service';

@Component({
  selector: 'app-patient-medical-records',
  imports: [DatePipe],
  templateUrl: './patient-medical-records.html',
  styleUrl: './patient-medical-records.css',
})
export class PatientMedicalRecords implements OnInit {
  protected readonly records = signal<MedicalRecord[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal('');

  constructor(
    private medicalRecordService: MedicalRecordService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const patient = this.authService.getCurrentUser();
    if (!patient) {
      this.isLoading.set(false);
      this.loadError.set('You must be signed in to view your medical records.');
      return;
    }

    this.medicalRecordService.getPatientRecords(patient.id).subscribe({
      next: (records) => {
        this.records.set(records);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load your medical records right now.');
        this.isLoading.set(false);
      },
    });
  }
}
