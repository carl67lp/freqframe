import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Note {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  expiresAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  private http = inject(HttpClient);
  private apiUrl = '/api/notes';

  getNotes(): Observable<Note[]> {
    const headers = new HttpHeaders({
      'X-Api-Key': environment.apiKey,
    });
    return this.http.get<Note[]>(this.apiUrl, { headers }).pipe(
      // Sort by createdAt, most recent first
      map((notes) =>
        notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      )
    );
  }

  deleteNote(id: string): Observable<void> {
    const headers = new HttpHeaders({
      'X-Api-Key': environment.apiKey,
    });
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }
}
