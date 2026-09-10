import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string | null;
  date: string; // ISO yyyy-MM-dd
  time: string;
  status: AppointmentStatus;
  rejectionReason: string | null;
  createdAt: string;
}

export interface CreateAppointmentRequest {
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
}

const APPOINTMENTS_API_URL = 'http://localhost:8081/api/appointments';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  constructor(private http: HttpClient) {}

  create(request: CreateAppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(APPOINTMENTS_API_URL, request);
  }

  getForPatient(patientId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${APPOINTMENTS_API_URL}/patient/${patientId}`);
  }

  getForDoctor(doctorId: string, status?: AppointmentStatus): Observable<Appointment[]> {
    const url = `${APPOINTMENTS_API_URL}/doctor/${doctorId}`;
    return this.http.get<Appointment[]>(status ? `${url}?status=${status}` : url);
  }

  getUnavailableTimes(doctorId: string, date: string): Observable<string[]> {
    return this.http.get<string[]>(`${APPOINTMENTS_API_URL}/doctor/${doctorId}/unavailable-times?date=${date}`);
  }

  accept(appointmentId: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${APPOINTMENTS_API_URL}/${appointmentId}/accept`, {});
  }

  reject(appointmentId: string, reason: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${APPOINTMENTS_API_URL}/${appointmentId}/reject`, { reason });
  }
}
