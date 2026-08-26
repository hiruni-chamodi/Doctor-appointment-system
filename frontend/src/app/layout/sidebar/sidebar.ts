import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
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
  protected readonly doctorName = 'Dr. Zenith';
  protected readonly doctorRole = 'Cardiologist';

  protected readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { label: 'Schedule', icon: 'schedule', path: '/schedule' },
    { label: 'Patients', icon: 'patients', path: '/patients' },
    { label: 'Medical Records', icon: 'records', path: '/records' },
    { label: 'Settings', icon: 'settings', path: '/settings' },
  ];
}
