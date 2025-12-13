import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarService } from '../services/calendar';

@Component({
  selector: 'app-calendar-pane',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-pane.html',
  styleUrl: './calendar-pane.css',
})

export class CalendarPane {
  private calendarService = inject(CalendarService);
  readonly start = new Date(Date.now());
  readonly end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  readonly events$ = this.calendarService.getEvents(this.start, this.end);

  constructor() {
    console.log('CalendarPane initialized, calling getEvents with:', { start: this.start, end: this.end });
  }

  onRefresh() {
    // TODO: add refresh method to service when needed
  }
}
