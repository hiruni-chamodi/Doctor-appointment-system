import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { Schedule } from './pages/schedule/schedule';
import { Patients } from './pages/patients/patients';
import { MedicalRecords } from './pages/medical-records/medical-records';
import { Settings } from './pages/settings/settings';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'schedule', component: Schedule },
      { path: 'patients', component: Patients },
      { path: 'records', component: MedicalRecords },
      { path: 'settings', component: Settings },
    ],
  },
];
