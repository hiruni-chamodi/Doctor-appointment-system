import { Routes } from '@angular/router';
import { PatientDashboardComponent } from './patient-dashboard/patient-dashboard.component';
import { PatientRegistrationComponent } from './patient-registration/patient-registration.component';
import { Login } from './login/login';
import { MainLayout } from './layout/main-layout/main-layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { Schedule } from './pages/schedule/schedule';
import { Patients } from './pages/patients/patients';
import { MedicalRecords } from './pages/medical-records/medical-records';
import { Settings } from './pages/settings/settings';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: PatientRegistrationComponent },
  { path: 'patient-dashboard', component: PatientDashboardComponent },
  {
    path: '',
    component: MainLayout,
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'schedule', component: Schedule },
      { path: 'patients', component: Patients },
      { path: 'records', component: MedicalRecords },
      { path: 'settings', component: Settings },
    ],
  },
];
