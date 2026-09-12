import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { MedicalRecord, MedicalRecordService } from '../../services/medical-record.service';

interface PatientSummary {
  id: string;
  fullName: string;
  email: string;
}

const PATIENTS_API_URL = 'http://localhost:8081/api/patients';

@Component({
  selector: 'app-medical-records',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './medical-records.html',
  styleUrl: './medical-records.css',
})
export class MedicalRecords implements OnInit {
  protected readonly patients = signal<PatientSummary[]>([]);
  protected readonly isLoadingPatients = signal(true);
  protected readonly loadError = signal('');

  protected searchQuery = '';
  protected readonly searchResults = signal<PatientSummary[]>([]);
  protected readonly showSearchDropdown = signal(false);

  protected readonly selectedPatient = signal<PatientSummary | null>(null);
  protected readonly records = signal<MedicalRecord[]>([]);
  protected readonly isLoadingRecords = signal(false);
  protected readonly recordsError = signal('');

  protected healthCondition = '';
  protected medicinesProvided = '';
  protected additionalNotes = '';
  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal('');
  protected readonly submitSuccess = signal(false);

  constructor(
    private http: HttpClient,
    private medicalRecordService: MedicalRecordService,
    private authService: AuthService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.http.get<PatientSummary[]>(PATIENTS_API_URL).subscribe({
      next: (patients) => {
        const sorted = [...patients].sort((a, b) => a.fullName.localeCompare(b.fullName));
        this.patients.set(sorted);
        this.isLoadingPatients.set(false);
        this.applyIncomingPatient(sorted);
      },
      error: () => {
        this.loadError.set('Unable to load patients right now. Please try again later.');
        this.isLoadingPatients.set(false);
      },
    });
  }

  /** Pre-selects the patient passed via ?patientId=&patientName= (e.g. the "Add medical record" button on the Schedule page). */
  private applyIncomingPatient(patients: PatientSummary[]): void {
    const patientId = this.route.snapshot.queryParamMap.get('patientId');
    if (!patientId) {
      return;
    }
    const patientName = this.route.snapshot.queryParamMap.get('patientName');
    const patient = patients.find((p) => p.id === patientId) ?? (patientName ? { id: patientId, fullName: patientName, email: '' } : null);
    if (patient) {
      this.selectPatient(patient);
    }
  }

  onSearchInput(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.searchResults.set([]);
      this.showSearchDropdown.set(false);
      return;
    }
    this.searchResults.set(this.patients().filter((p) => p.fullName.toLowerCase().includes(query)));
    this.showSearchDropdown.set(true);
  }

  selectPatient(patient: PatientSummary): void {
    this.selectedPatient.set(patient);
    this.searchQuery = '';
    this.searchResults.set([]);
    this.showSearchDropdown.set(false);
    this.resetForm();
    this.loadRecords(patient.id);
  }

  changePatient(): void {
    this.selectedPatient.set(null);
    this.records.set([]);
    this.recordsError.set('');
    this.resetForm();
  }

  /** Slight delay so a mousedown on a dropdown item registers before the input's blur closes it. */
  closeDropdown(): void {
    setTimeout(() => this.showSearchDropdown.set(false), 150);
  }

  submitRecord(): void {
    const patient = this.selectedPatient();
    if (!patient || !this.healthCondition.trim() || this.isSubmitting()) {
      return;
    }

    const doctor = this.authService.getCurrentUser();
    this.isSubmitting.set(true);
    this.submitError.set('');
    this.submitSuccess.set(false);

    this.medicalRecordService
      .addRecord({
        patientId: patient.id,
        doctorId: doctor?.id ?? null,
        doctorName: doctor?.fullName ?? null,
        healthCondition: this.healthCondition.trim(),
        medicinesProvided: this.medicinesProvided.trim() || null,
        additionalNotes: this.additionalNotes.trim() || null,
      })
      .subscribe({
        next: (record) => {
          this.records.update((list) => [record, ...list]);
          this.resetForm();
          this.isSubmitting.set(false);
          this.submitSuccess.set(true);
        },
        error: () => {
          this.submitError.set('Unable to save this record right now. Please try again.');
          this.isSubmitting.set(false);
        },
      });
  }

  private loadRecords(patientId: string): void {
    this.isLoadingRecords.set(true);
    this.recordsError.set('');
    this.medicalRecordService.getPatientRecords(patientId).subscribe({
      next: (records) => {
        this.records.set(records);
        this.isLoadingRecords.set(false);
      },
      error: () => {
        this.recordsError.set("Unable to load this patient's medical records.");
        this.isLoadingRecords.set(false);
      },
    });
  }

  private resetForm(): void {
    this.healthCondition = '';
    this.medicinesProvided = '';
    this.additionalNotes = '';
    this.submitError.set('');
    this.submitSuccess.set(false);
  }
}
