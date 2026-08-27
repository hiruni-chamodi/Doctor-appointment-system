import { Component, OnInit, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface PatientRecord {
  id: string;
  fullName: string;
  email: string;
  bloodType: string;
  allergies: string[];
  lastVisitDate: string;
}

const API_URL = 'http://localhost:8081/api/patients';

@Component({
  selector: 'app-medical-records',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './medical-records.html',
  styleUrl: './medical-records.css',
})
export class MedicalRecords implements OnInit {
  protected readonly patients = signal<PatientRecord[]>([]);
  protected readonly currentIndex = signal(0);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal('');

  protected searchQuery = '';
  protected readonly searchResults = signal<PatientRecord[]>([]);
  protected readonly showSearchDropdown = signal(false);

  protected readonly currentPatient = computed<PatientRecord | null>(() => {
    const list = this.patients();
    return list.length ? list[this.currentIndex()] : null;
  });

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<PatientRecord[]>(API_URL).subscribe({
      next: (patients) => {
        this.patients.set(patients);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load patients right now. Please try again later.');
        this.isLoading.set(false);
      },
    });
  }

  next(): void {
    const total = this.patients().length;
    if (total === 0) return;
    this.currentIndex.set((this.currentIndex() + 1) % total);
  }

  previous(): void {
    const total = this.patients().length;
    if (total === 0) return;
    this.currentIndex.set((this.currentIndex() - 1 + total) % total);
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

  selectPatient(patient: PatientRecord): void {
    const index = this.patients().findIndex((p) => p.id === patient.id);
    if (index !== -1) {
      this.currentIndex.set(index);
    }
    this.searchQuery = '';
    this.searchResults.set([]);
    this.showSearchDropdown.set(false);
  }

  /** Slight delay so a mousedown on a dropdown item registers before the input's blur closes it. */
  closeDropdown(): void {
    setTimeout(() => this.showSearchDropdown.set(false), 150);
  }
}
