import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Reminder {
  id: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface CreateReminderRequest {
  doctorId: string;
  patientId: string;
  message: string;
}

const REMINDERS_API_URL = 'http://localhost:8081/api/reminders';

@Injectable({ providedIn: 'root' })
export class ReminderService {
  constructor(private http: HttpClient) {}

  create(request: CreateReminderRequest): Observable<Reminder> {
    return this.http.post<Reminder>(REMINDERS_API_URL, request);
  }

  getForPatient(patientId: string): Observable<Reminder[]> {
    return this.http.get<Reminder[]>(`${REMINDERS_API_URL}/patient/${patientId}`);
  }

  markRead(reminderId: string): Observable<Reminder> {
    return this.http.patch<Reminder>(`${REMINDERS_API_URL}/${reminderId}/read`, {});
  }
}
