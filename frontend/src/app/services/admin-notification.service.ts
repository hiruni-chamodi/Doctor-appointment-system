import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NotifyPatientRequest {
  appointmentId: string;
  message: string;
}

export interface NotifyPatientResponse {
  message: string;
}

const ADMIN_API_URL = 'http://localhost:8081/api/admin';

@Injectable({ providedIn: 'root' })
export class AdminNotificationService {
  constructor(private http: HttpClient) {}

  notifyPatient(request: NotifyPatientRequest): Observable<NotifyPatientResponse> {
    return this.http.post<NotifyPatientResponse>(`${ADMIN_API_URL}/notify-patient`, request);
  }
}