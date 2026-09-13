import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientMedicalRecords } from './patient-medical-records';

describe('PatientMedicalRecords', () => {
  let component: PatientMedicalRecords;
  let fixture: ComponentFixture<PatientMedicalRecords>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientMedicalRecords],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientMedicalRecords);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
