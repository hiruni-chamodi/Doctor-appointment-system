import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
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

  constructor(private authService: AuthService) {
    const user = this.authService.getCurrentUser();
    this.profileName = user?.fullName ?? 'Doctor';
    this.profileRole = user?.specialty || 'Doctor';
  }
}
