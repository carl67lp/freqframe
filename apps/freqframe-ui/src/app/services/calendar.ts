import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CalendarEvent } from '@freqframe/shared-types';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private http = inject(HttpClient);
  // Use relative path if in production (detected by hostname), otherwise use localhost
  private apiBaseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
  private url = `${this.apiBaseUrl}/api/calendars/events`;

  getEvents(startDate?: Date, endDate?: Date): Observable<CalendarEvent[]> {
    let params = new HttpParams();
    if (startDate) {
      params = params.set('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.set('endDate', endDate.toISOString());
    }

    const headers = new HttpHeaders({
      'X-Api-Key': environment.apiKey,
    });

    return this.http
      .get<{ status: number; events: CalendarEvent[] }>(this.url, { params, headers })
      .pipe(
        map((response) => {
          return response.events;
        })
      );
  }
}
