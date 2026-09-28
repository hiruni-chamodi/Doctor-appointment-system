import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthUser } from './auth.service';

export interface AddPatientRequest {
  fullName: string;
  phoneNumber: string;
}

const ADMIN_USERS_API_URL = 'http://localhost:8081/api/admin/users';

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  constructor(private http: HttpClient) {}

  addPatient(request: AddPatientRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${ADMIN_USERS_API_URL}/add-patient`, request);
  }
}
