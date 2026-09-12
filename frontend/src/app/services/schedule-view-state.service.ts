import { Injectable } from '@angular/core';

export type ScheduleViewMode = 'Day' | 'Week' | 'Month';

/**
 * Remembers which date/view the doctor last had open on the Schedule page.
 *
 * The Schedule component is destroyed and rebuilt every time the doctor navigates away
 * (e.g. to add a medical record for a patient) and back, since they're different routes.
 * Without this, it would reset to "today / Week view" on every return, making any
 * appointment outside that default window look like it had vanished even though nothing
 * changed in the database.
 */
@Injectable({ providedIn: 'root' })
export class ScheduleViewStateService {
  activeView: ScheduleViewMode = 'Week';
  /** ISO yyyy-MM-dd of the last viewed date, or null if it's never been set (defaults to today). */
  anchorIso: string | null = null;
}
