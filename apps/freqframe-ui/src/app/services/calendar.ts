import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CalendarEvent } from '@freqframe/shared-types';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private http = inject(HttpClient);
  private url = 'http://localhost:3000/api/calendars/events/'; // XXX: adjust for deployment

  getEvents(startDate?: Date, endDate?: Date): Observable<CalendarEvent[]> {
    let params = new HttpParams();
    if (startDate) {
      params = params.set('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.set('endDate', endDate.toISOString());
    }

    console.log('Calling calendar API:', this.url, params.toString());

    return this.http
      .get<{ status: number; events: CalendarEvent[] }>(this.url, { params })
      .pipe(map((response) => {
        console.log('Calendar events received:', response.events);
        return response.events;
      }));
  }
}
