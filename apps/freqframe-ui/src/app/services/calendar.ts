import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, interval, switchMap, startWith } from 'rxjs';
import { CalendarEvent } from '@freqframe/shared-types';

@Injectable({
  providedIn: 'root',
})

export class CalendarService {
  private http = inject(HttpClient);
  private url = '/api/calendars/events'; // Relative path - uses current origin

  getEvents(startDate?: Date, endDate?: Date): Observable<CalendarEvent[]> {
    let params = new HttpParams();
    if (startDate) {
      params = params.set('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.set('endDate', endDate.toISOString());
    }

    return this.http
      .get<{ status: number; events: CalendarEvent[] }>(this.url, { params })
      .pipe(map((response) => {
        return response.events;
      }));
  }

  getEventsAutoRefresh(startDate: Date, endDate: Date, refreshIntervalMs = 300000): Observable<CalendarEvent[]> {
    return interval(refreshIntervalMs).pipe(
      startWith(0),
      switchMap(() => this.getEvents(startDate, endDate))
    );
  }
}
