import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotesService, Note } from '../services/notes.service';

@Component({
  selector: 'app-qso-pane',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qso-pane.html',
  styleUrl: './qso-pane.css',
})
export class QsoPane implements OnInit, OnDestroy {
  private notesService = inject(NotesService);
  private refreshInterval?: ReturnType<typeof setInterval>;

  notes: Note[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadNotes();
    // Auto-refresh every 15 seconds
    this.refreshInterval = setInterval(() => {
      this.loadNotes();
    }, 15000);
  }

  ngOnDestroy(): void {
    // Clean up interval to prevent memory leaks
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadNotes(): void {
    this.loading = true;
    this.error = null;

    this.notesService.getNotes().subscribe({
      next: (notes) => {
        this.notes = notes;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load notes';
        this.loading = false;
        console.error('Error loading notes:', err);
      },
    });
  }

  deleteNote(id: string): void {
    this.notesService.deleteNote(id).subscribe({
      next: () => {
        this.loadNotes(); // Refresh the list
      },
      error: (err) => {
        console.error('Error deleting note:', err);
      },
    });
  }
}
