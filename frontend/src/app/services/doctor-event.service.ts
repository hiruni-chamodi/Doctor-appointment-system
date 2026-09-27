import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DoctorEvent {
  id: string;
  doctorId: string;
  date: string; // ISO yyyy-MM-dd
  time: string | null; // null = blocks the whole day
  title: string;
  createdAt: string;
}

export interface CreateDoctorEventPayload {
  doctorId: string;
  date: string;
  time?: string | null;
  title: string;
}

const DOCTOR_EVENTS_API_URL = 'http://localhost:8081/api/doctor-events';

@Injectable({ providedIn: 'root' })
export class DoctorEventService {
  constructor(private http: HttpClient) {}

  getForDoctor(doctorId: string): Observable<DoctorEvent[]> {
    return this.http.get<DoctorEvent[]>(`${DOCTOR_EVENTS_API_URL}/doctor/${doctorId}`);
  }

  create(payload: CreateDoctorEventPayload): Observable<DoctorEvent> {
    return this.http.post<DoctorEvent>(DOCTOR_EVENTS_API_URL, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${DOCTOR_EVENTS_API_URL}/${id}`);
  }
}
