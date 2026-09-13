import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { NavItem } from '../sidebar/sidebar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {
  protected readonly profileName: string;
  protected readonly profileRole: string;
  protected readonly navItems: NavItem[];
  protected readonly isAdmin: boolean;

  constructor(private authService: AuthService) {
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.role === 'ADMIN';
    this.profileName = user?.fullName ?? (this.isAdmin ? 'Clinic Admin' : 'Doctor');
    this.profileRole = this.isAdmin ? 'Admin' : user?.specialty || 'Doctor';
    this.navItems = this.isAdmin
      ? [
          { label: 'Dashboard', icon: 'dashboard', path: '/admin-dashboard' },
          { label: 'Schedule', icon: 'schedule', path: '/schedule' },
          { label: 'Patients', icon: 'patients', path: '/patients' },
          { label: 'Records', icon: 'records', path: '/records' },
          { label: 'Settings', icon: 'settings', path: '/settings' },
        ]
      : [
          { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
          { label: 'Schedule', icon: 'schedule', path: '/schedule' },
          { label: 'Patients', icon: 'patients', path: '/patients' },
          { label: 'Medical Records', icon: 'records', path: '/records' },
          { label: 'Settings', icon: 'settings', path: '/settings' },
        ];
  }
}
