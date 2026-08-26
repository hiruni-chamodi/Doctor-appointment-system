import { Routes } from '@angular/router';
import { PatientRegistrationComponent } from './patient-registration/patient-registration.component';
import { PatientDashboardComponent } from './patient-dashboard/patient-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'register', pathMatch: 'full' },
  { path: 'register', component: PatientRegistrationComponent },
  { path: 'patient-dashboard', component: PatientDashboardComponent },
];
