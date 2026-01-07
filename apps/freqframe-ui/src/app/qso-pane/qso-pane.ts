import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotesService, Note } from '../services/notes.service';

@Component({
  selector: 'app-qso-pane',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qso-pane.html',
  styleUrl: './qso-pane.css',
})
export class QsoPane implements OnInit {
  private notesService = inject(NotesService);

  notes: Note[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadNotes();
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
