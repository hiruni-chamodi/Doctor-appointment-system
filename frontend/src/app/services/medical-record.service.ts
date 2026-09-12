import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MedicalRecord {
  id: string;
  patientId: string;
  healthCondition: string;
  medicinesProvided: string | null;
  additionalNotes: string | null;
  dateRecorded: string;
}

const MEDICAL_RECORDS_API_URL = 'http://localhost:8081/api/medical-records';

@Injectable({ providedIn: 'root' })
export class MedicalRecordService {
  constructor(private http: HttpClient) {}

  getPatientRecords(patientId: string): Observable<MedicalRecord[]> {
    return this.http.get<MedicalRecord[]>(`${MEDICAL_RECORDS_API_URL}/patient/${patientId}`);
  }
}
