import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, shareReplay } from 'rxjs';
import { CalendarService } from '../services/calendar';
import { CalendarEvent } from '@freqframe/shared-types';

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

  readonly events$ = new Observable<CalendarEvent[]>(observer => {
    const refreshInterval = setInterval(() => {
      const start = new Date();
      const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      this.calendarService.getEvents(start, end).subscribe(
        (events) => observer.next(events),
        (error) => observer.error(error)
      );
    }, 300000); // 5 minutes

    // Initial fetch
    const start = new Date();
    const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    this.calendarService.getEvents(start, end).subscribe(
      (events) => observer.next(events),
      (error) => observer.error(error)
    );

    return () => clearInterval(refreshInterval);
  }).pipe(shareReplay(1));

  onRefresh() {
    // TODO: add refresh method to service when needed
  }
}
