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