import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Doctor {
  id: string;
  fullName: string;
  specialty: string | null;
  dailyStartTime: string | null;
  maxPatientsPerDay: number | null;
}

export interface UpdateDoctorSettingsPayload {
  dailyStartTime: string;
  maxPatientsPerDay: number;
}

const DOCTORS_API_URL = 'http://localhost:8081/api/doctors';

@Injectable({ providedIn: 'root' })
export class DoctorService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(DOCTORS_API_URL);
  }

  getOne(doctorId: string): Observable<Doctor> {
    return this.http.get<Doctor>(`${DOCTORS_API_URL}/${doctorId}`);
  }

  updateSettings(doctorId: string, payload: UpdateDoctorSettingsPayload): Observable<Doctor> {
    return this.http.put<Doctor>(`${DOCTORS_API_URL}/${doctorId}/settings`, payload);
  }
}
