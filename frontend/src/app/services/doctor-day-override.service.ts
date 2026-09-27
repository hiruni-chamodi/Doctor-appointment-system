import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** A doctor's start time / patient capacity for one specific date, overriding their standing default. */
export interface DoctorDayOverride {
  id: string;
  doctorId: string;
  date: string; // ISO yyyy-MM-dd
  startTime: string;
  maxPatients: number;
}

export interface UpsertDayOverridePayload {
  startTime: string;
  maxPatients: number;
}

const DOCTORS_API_URL = 'http://localhost:8081/api/doctors';

@Injectable({ providedIn: 'root' })
export class DoctorDayOverrideService {
  constructor(private http: HttpClient) {}

  get(doctorId: string, date: string): Observable<DoctorDayOverride> {
    return this.http.get<DoctorDayOverride>(`${DOCTORS_API_URL}/${doctorId}/day-overrides/${date}`);
  }

  upsert(doctorId: string, date: string, payload: UpsertDayOverridePayload): Observable<DoctorDayOverride> {
    return this.http.put<DoctorDayOverride>(`${DOCTORS_API_URL}/${doctorId}/day-overrides/${date}`, payload);
  }

  delete(doctorId: string, date: string): Observable<void> {
    return this.http.delete<void>(`${DOCTORS_API_URL}/${doctorId}/day-overrides/${date}`);
  }
}
