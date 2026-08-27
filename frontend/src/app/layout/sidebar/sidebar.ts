import { Component, Input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export interface NavItem {
  label: string;
  icon: string;
  path: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  @Input() profileName = 'Dr. Zenith';
  @Input() profileRole = 'Cardiologist';
  @Input() primaryActionLabel = 'New Appointment';

  @Input() navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { label: 'Schedule', icon: 'schedule', path: '/schedule' },
    { label: 'Patients', icon: 'patients', path: '/patients' },
    { label: 'Medical Records', icon: 'records', path: '/records' },
    { label: 'Settings', icon: 'settings', path: '/settings' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
