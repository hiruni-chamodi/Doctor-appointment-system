import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DoctorService } from '../../services/doctor.service';
import { BOOKABLE_TIME_SLOTS } from '../../shared/time-slots';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {
  protected readonly timeSlots = BOOKABLE_TIME_SLOTS;

  protected readonly isLoading = signal(true);
  protected readonly loadError = signal('');
  protected readonly isSaving = signal(false);
  protected readonly saveError = signal('');
  protected readonly saveSuccess = signal(false);

  protected dailyStartTime = '';
  protected maxPatientsPerDay = 8;
  protected profilePictureBase64: string | null = null;
  protected profileInitial = 'D';

  private doctorId = '';

  constructor(
    private authService: AuthService,
    private doctorService: DoctorService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user || (user.role !== 'DOCTOR' && user.role !== 'ADMIN')) {
      this.loadError.set('Only a doctor account has scheduling settings.');
      this.isLoading.set(false);
      return;
    }

    this.doctorId = user.id;
    this.profileInitial = user.fullName?.charAt(0).toUpperCase() || 'D';
    this.doctorService.getOne(user.id).subscribe({
      next: (doctor) => {
        this.dailyStartTime = doctor.dailyStartTime || this.timeSlots[0];
        this.maxPatientsPerDay = doctor.maxPatientsPerDay || 8;
        this.profilePictureBase64 = doctor.profilePictureBase64;
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load your settings right now.');
        this.isLoading.set(false);
      },
    });
  }

  protected onProfilePictureSelected(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.files?.length) {
      return;
    }

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.saveError.set('Please select an image file.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.profilePictureBase64 = reader.result;
        this.saveError.set('');
        this.saveSuccess.set(false);
      }
    };
    reader.onerror = () => this.saveError.set('Unable to read that image.');
    reader.readAsDataURL(file);
    input.value = '';
  }

  protected save(): void {
    if (!this.dailyStartTime || this.maxPatientsPerDay < 1 || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.saveError.set('');
    this.saveSuccess.set(false);

    this.doctorService
      .updateSettings(this.doctorId, {
        dailyStartTime: this.dailyStartTime,
        maxPatientsPerDay: this.maxPatientsPerDay,
        profilePictureBase64: this.profilePictureBase64,
      })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.saveSuccess.set(true);
        },
        error: (err) => {
          this.isSaving.set(false);
          this.saveError.set(err?.error?.message || 'Unable to save your settings right now.');
        },
      });
  }
}
