import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, interval, of, startWith, switchMap } from 'rxjs';
import { ChoreBoardState } from '@freqframe/shared-types';
import { environment } from '../../environments/environment';

/**
 * The board is already cached for ~30s by freqframe-api, so this only controls
 * how quickly a completed chore shows up on the wall.
 */
const REFRESH_INTERVAL_MS = 60_000;

@Injectable({
  providedIn: 'root',
})
export class ChoresService {
  private http = inject(HttpClient);
  // Same origin detection as CalendarService.
  private apiBaseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
  private url = `${this.apiBaseUrl}/api/chores`;

  getBoard(): Observable<ChoreBoardState> {
    const headers = new HttpHeaders({
      'X-Api-Key': environment.apiKey,
    });

    return this.http.get<ChoreBoardState>(this.url, { headers }).pipe(
      catchError((error) => {
        console.error('Chore board fetch error:', error);
        // Mirror the API's own failure shape so the pane has one thing to check.
        return of({ unavailable: true, reason: 'unreachable' } as ChoreBoardState);
      })
    );
  }

  getBoardAutoRefresh(refreshIntervalMs = REFRESH_INTERVAL_MS): Observable<ChoreBoardState> {
    return interval(refreshIntervalMs).pipe(
      startWith(0),
      switchMap(() => this.getBoard())
    );
  }
}
