import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService, AuthUser } from '../../services/auth.service';

interface HelpCategory {
  icon: 'calendar' | 'shield' | 'devices';
  title: string;
  description: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-help-center',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './help-center.html',
  styleUrl: './help-center.css',
})
export class HelpCenter {
  protected readonly currentUser: AuthUser | null;
  protected readonly dashboardPath: string;

  protected searchQuery = '';
  private readonly openFaqIndex = signal<number | null>(null);

  protected readonly categories: HelpCategory[] = [
    {
      icon: 'calendar',
      title: 'Booking Help',
      description: 'Learn how to schedule, reschedule, or cancel your appointments online.',
    },
    {
      icon: 'shield',
      title: 'Insurance & Billing',
      description: 'Understand accepted plans, copays, and how to read your medical bills.',
    },
    {
      icon: 'devices',
      title: 'App Tutorials',
      description: 'Guides on using the patient portal, telehealth, and mobile app features.',
    },
  ];

  protected readonly faqs: FaqItem[] = [
    {
      question: 'How do I reset my portal password?',
      answer:
        'Select "Forgot password" on the login screen to receive a reset link by email. If it doesn\'t arrive within a few minutes, check your spam folder or reach out to our support team for help.',
    },
    {
      question: 'Can I book a same-day appointment?',
      answer:
        'Same-day appointments are available for select providers based on current availability. Use "Book Appointment" from your dashboard and look for slots marked as available today, or call our office directly for urgent needs.',
    },
    {
      question: 'What should I bring to my first visit?',
      answer:
        'Please bring a valid photo ID, your insurance card, and a list of any current medications. Arriving 15 minutes early to complete paperwork is also recommended.',
    },
  ];

  constructor(private authService: AuthService) {
    this.currentUser = this.authService.getCurrentUser();
    this.dashboardPath =
      this.currentUser?.role === 'DOCTOR' || this.currentUser?.role === 'ADMIN'
        ? '/dashboard'
        : this.currentUser?.role === 'RECEPTIONIST'
          ? '/receptionist-dashboard'
          : '/patient-dashboard';
  }

  toggleFaq(index: number): void {
    this.openFaqIndex.set(this.openFaqIndex() === index ? null : index);
  }

  isFaqOpen(index: number): boolean {
    return this.openFaqIndex() === index;
  }
}
