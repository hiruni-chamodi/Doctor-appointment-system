import { Routes } from '@angular/router';
import { PatientDashboardComponent } from './patient-dashboard/patient-dashboard.component';
import { PatientRegistrationComponent } from './patient-registration/patient-registration.component';
import { Login } from './login/login';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: PatientRegistrationComponent },
  { path: 'patient-dashboard', component: PatientDashboardComponent },
];
