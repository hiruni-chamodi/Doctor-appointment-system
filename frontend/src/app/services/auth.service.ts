import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export type UserRole = 'DOCTOR' | 'PATIENT';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  specialty?: string | null;
}

const STORAGE_KEY = 'zenith_current_user';
const API_BASE = 'http://localhost:8081/api/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSignal = signal<AuthUser | null>(this.readFromStorage());

  constructor(private http: HttpClient) {}

  register(
    fullName: string,
    email: string,
    password: string,
    role: UserRole,
    specialty?: string,
  ): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${API_BASE}/register`, { fullName, email, password, role, specialty });
  }

  login(email: string, password: string): Observable<AuthUser> {
    return this.http
      .post<AuthUser>(`${API_BASE}/login`, { email, password })
      .pipe(tap((user) => this.setCurrentUser(user)));
  }

  /** Returns the signed-in user, falling back to localStorage if the in-memory signal was reset (e.g. after a refresh). */
  getCurrentUser(): AuthUser | null {
    const current = this.currentUserSignal();
    if (current) {
      return current;
    }
    const stored = this.readFromStorage();
    if (stored) {
      this.currentUserSignal.set(stored);
    }
    return stored;
  }

  logout(): void {
    this.currentUserSignal.set(null);
    this.removeFromStorage();
  }

  private setCurrentUser(user: AuthUser): void {
    this.currentUserSignal.set(user);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // localStorage unavailable (e.g. private browsing) — session stays in-memory only.
    }
  }

  private readFromStorage(): AuthUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }

  private removeFromStorage(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
