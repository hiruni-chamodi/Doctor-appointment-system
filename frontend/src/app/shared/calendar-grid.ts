export interface CalendarCell {
  date: Date | null;
  day: number;
  isPast: boolean;
  isSelected: boolean;
  isToday: boolean;
}

/** Midnight-local copy of a date, so day-level comparisons aren't thrown off by time-of-day. */
export function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** A 7-wide grid of weeks covering the given month, padded with blank cells to align on Sunday. */
export function buildMonthGrid(year: number, month: number, selected: Date | null, today: Date): CalendarCell[][] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const blankCell = (): CalendarCell => ({ date: null, day: 0, isPast: false, isSelected: false, isToday: false });

  const cells: CalendarCell[] = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push(blankCell());
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    cells.push({
      date,
      day,
      isPast: date.getTime() < today.getTime(),
      isSelected: selected !== null && date.getTime() === selected.getTime(),
      isToday: date.getTime() === today.getTime(),
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push(blankCell());
  }

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}
