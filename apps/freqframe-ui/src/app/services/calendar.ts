import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

// config for each calendar
export interface CalendarSource {
  id: string; // short id (e.g. 'work', 'home')
  name: string; // readable display name
  url: string; // ICS/URL to fetch
  color?: string; // optional accent color for UI
  enabled?: boolean; // toggle
}

// canonical event exposed to the app
export interface CalendarEvent {
  id: string; // stable id (UID or generated)
  calendarId?: string; // source id
  calendarName?: string; // source display name
  title: string;
  description?: string;
  location?: string;
  start: string; // ISO 8601 (UTC or local) — pick one consistently
  end?: string; // ISO 8601
  allDay?: boolean;
  isRecurring?: boolean; // true if from a recurring rule/instance
  originalStart?: string; // for recurring instances, the original recurrence start
  raw?: unknown; // raw parser output (optional)
}

// per-calendar fetch/parse status (helpful for UI)
export interface CalendarFetchResult {
  sourceId: string;
  ok: boolean;
  error?: string;
  lastFetched?: string; // ISO timestamp
}

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  // constructor(private http: HttpClient) {}

  // // Observable that emits merged, sorted, upcoming events across all sources.
  // // Emits on initial load and whenever refresh occurs.
  // readonly events$: Observable<CalendarEvent[]>;

  // // Optional: per-source statuses for UI (errors, lastFetched)
  // readonly sourceStatus$: Observable<CalendarFetchResult[]>;

  // // Force an immediate refresh (returns a promise or observable for completion)
  // refresh(): Promise<void>;

  // // Optionally expose last updated timestamp
  // readonly lastUpdated$: Observable<string | null>;

  // // Optionally: get raw events from a specific source (useful for debugging)
  // getRawCalendar(sourceId: string): Observable<unknown>;
}
