import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, shareReplay, Subscriber } from 'rxjs';
import { CalendarService } from '../services/calendar';
import { CalendarEvent } from '@freqframe/shared-types';

interface GroupedEvent {
  dateLabel: string;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-calendar-pane',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-pane.html',
  styleUrl: './calendar-pane.css',
})
export class CalendarPane {
  private calendarService = inject(CalendarService);
  private readonly calendarRefreshInterval = 30 * (60 * 1000); // 30 minutes
  lastUpdated: Date | null = null;

  readonly groupedEvents$ = new Observable<GroupedEvent[]>((observer) => {
    const refreshInterval = setInterval(() => {
      this.fetchAndGroupEvents(observer);
    }, this.calendarRefreshInterval);

    // Initial fetch
    this.fetchAndGroupEvents(observer);

    return () => clearInterval(refreshInterval);
  }).pipe(shareReplay(1));

  private fetchAndGroupEvents(observer: Subscriber<GroupedEvent[]>) {
    if (observer.closed) {
      return;
    }
    const start = new Date();
    const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    this.calendarService.getEvents(start, end).subscribe({
      next: (events) => {
        const grouped = this.groupEventsByDate(events);
        this.lastUpdated = new Date();
        observer.next(grouped);
      },
      error: (error) => {
        // Log but don't propagate — propagating kills the outer Observable and stops polling.
        console.error('Calendar fetch error:', error);
      },
    });
  }

  private groupEventsByDate(events: CalendarEvent[]): GroupedEvent[] {
    const grouped = new Map<string, { events: CalendarEvent[]; sortKey: string }>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const event of events) {
      const eventDate = new Date(event.start);
      eventDate.setHours(0, 0, 0, 0);
      const { label, sortKey } = this.getDateLabel(eventDate, today);

      if (!grouped.has(label)) {
        grouped.set(label, { events: [], sortKey });
      }
      grouped.get(label)!.events.push(event);
    }

    // Sort by sort key and return
    return Array.from(grouped.entries())
      .map(([dateLabel, { events, sortKey }]) => ({ dateLabel, events, sortKey }))
      .sort((a, b) => {
        const aKey = a.sortKey;
        const bKey = b.sortKey;
        // Sort keys are ISO dates or order indices, so string comparison works
        return aKey.localeCompare(bKey);
      })
      .map(({ dateLabel, events }) => ({ dateLabel, events }));
  }

  private getDateLabel(eventDate: Date, today: Date): { label: string; sortKey: string } {
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    // The label varies with how near the date is, but the sort key is always
    // the calendar date. Mixing relative keys ('0-today') with ISO keys sorted
    // any date before today — an event still in progress — below every other
    // group, because '2026-07-22' string-compares after '2-03-Friday'.
    const sortKey = toLocalIsoDate(eventDate);

    if (diffDays === 0) return { label: 'Today', sortKey };
    if (diffDays === 1) return { label: 'Tomorrow', sortKey };

    // Within one week, show day of week
    if (diffDays > 1 && diffDays < 7) {
      return { label: eventDate.toLocaleDateString('en-US', { weekday: 'long' }), sortKey };
    }

    // Beyond one week (or already past), show the full date
    const label = eventDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return { label, sortKey };
  }
}

/**
 * YYYY-MM-DD for the date as it reads on a local wall calendar. `toISOString`
 * would convert local midnight to UTC and land on the previous day for any
 * timezone east of Greenwich.
 */
function toLocalIsoDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
