import { Component, inject, OnInit } from '@angular/core';
import { AuthService, AuthUser } from '../services/auth.service';

@Component({
  selector: 'app-profile-settings',
  imports: [],
  templateUrl: './profile-settings.html',
  styleUrl: './profile-settings.css',
})
export class ProfileSettings implements OnInit {
  authService = inject(AuthService);
  currentUser: AuthUser | null = null;
  firstName = '';
  lastName = '';

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      const names = this.currentUser.fullName.split(' ');
      this.firstName = names[0] || '';
      this.lastName = names.slice(1).join(' ') || '';
    }
  }
}
