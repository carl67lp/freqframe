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
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const isoDate = eventDate.toISOString().split('T')[0]; // YYYY-MM-DD

    if (diffDays === 0) return { label: 'Today', sortKey: '0-today' };
    if (diffDays === 1) return { label: 'Tomorrow', sortKey: '1-tomorrow' };

    // Within one week, show day of week
    if (diffDays > 1 && diffDays < 7) {
      const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'long' });
      const sortKey = `2-${diffDays.toString().padStart(2, '0')}-${dayName}`;
      return { label: dayName, sortKey };
    }

    // Beyond one week, show full date with ISO key for proper sorting
    const label = eventDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return { label, sortKey: isoDate };
  }

}
