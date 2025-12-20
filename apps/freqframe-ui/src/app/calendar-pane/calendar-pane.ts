import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, map, shareReplay } from 'rxjs';
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
  readonly currentDate = new Date();

  readonly groupedEvents$ = new Observable<GroupedEvent[]>(observer => {
    const refreshInterval = setInterval(() => {
      this.fetchAndGroupEvents(observer);
    }, 300000); // 5 minutes

    // Initial fetch
    this.fetchAndGroupEvents(observer);

    return () => clearInterval(refreshInterval);
  }).pipe(shareReplay(1));

  private fetchAndGroupEvents(observer: any) {
    const start = new Date();
    const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    this.calendarService.getEvents(start, end).subscribe(
      (events) => {
        const grouped = this.groupEventsByDate(events);
        observer.next(grouped);
      },
      (error) => observer.error(error)
    );
  }

  private groupEventsByDate(events: CalendarEvent[]): GroupedEvent[] {
    const grouped = new Map<string, CalendarEvent[]>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const event of events) {
      const eventDate = new Date(event.start);
      eventDate.setHours(0, 0, 0, 0);
      const dateLabel = this.getDateLabel(eventDate, today);

      if (!grouped.has(dateLabel)) {
        grouped.set(dateLabel, []);
      }
      grouped.get(dateLabel)!.push(event);
    }

    // Sort by date and return
    return Array.from(grouped.entries())
      .map(([dateLabel, events]) => ({ dateLabel, events }))
      .sort((a, b) => this.compareDateLabels(a.dateLabel, b.dateLabel));
  }

  private getDateLabel(eventDate: Date, today: Date): string {
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';

    // Within one week, show day of week
    if (diffDays > 1 && diffDays < 7) {
      const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'long' });
      return dayName;
    }

    // Beyond one week, show full date
    return eventDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private compareDateLabels(a: string, b: string): number {
    const order = ['Today', 'Tomorrow', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const aIndex = order.indexOf(a);
    const bIndex = order.indexOf(b);

    // If both are in order array, sort by that order
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    // If one is in order array, it comes first
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    // Otherwise sort alphabetically (for dates like "Dec 28, 2025")
    return a.localeCompare(b);
  }

  onRefresh() {
    // TODO: add refresh method to service when needed
  }
}
