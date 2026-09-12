import { Routes } from '@angular/router';
import { PatientDashboardComponent } from './patient-dashboard/patient-dashboard.component';
import { PatientRegistrationComponent } from './patient-registration/patient-registration.component';
import { Login } from './login/login';
import { MainLayout } from './layout/main-layout/main-layout';
import { PatientLayout } from './layout/patient-layout/patient-layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { Schedule } from './pages/schedule/schedule';
import { Patients } from './pages/patients/patients';
import { MedicalRecords } from './pages/medical-records/medical-records';
import { Settings } from './pages/settings/settings';
import { HelpCenter } from './pages/help-center/help-center';
import { adminGuard, doctorGuard, patientGuard } from './guards/auth.guard';
import { FindDoctor } from './find-doctor/find-doctor';
import { MyAppointments } from './my-appointments/my-appointments';
import { PatientMedicalRecords } from './patient-medical-records/patient-medical-records';
import { ProfileSettings } from './profile-settings/profile-settings';
import { ReceptionistDashboard } from './receptionist-dashboard/receptionist-dashboard';
import { AdminDashboard } from './admin-dashboard/admin-dashboard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: PatientRegistrationComponent },
  { path: 'help-center', component: HelpCenter },
  {
    path: '',
    component: PatientLayout,
    canActivate: [patientGuard],
    children: [
      { path: 'patient-dashboard', component: PatientDashboardComponent },
      { path: 'find-doctor', component: FindDoctor },
      { path: 'my-appointments', component: MyAppointments },
      { path: 'medical-records', component: PatientMedicalRecords },
      { path: 'profile', component: ProfileSettings },
    ],
  },
  {
    path: '',
    component: MainLayout,
    children: [
      { path: 'dashboard', component: Dashboard, canActivate: [doctorGuard] },
      { path: 'schedule', component: Schedule },
      { path: 'patients', component: Patients },
      { path: 'records', component: MedicalRecords },
      { path: 'settings', component: Settings },
      { path: 'receptionist-dashboard', component: ReceptionistDashboard },
      { path: 'admin-dashboard', component: AdminDashboard, canActivate: [adminGuard] },
    ],
  },
];
