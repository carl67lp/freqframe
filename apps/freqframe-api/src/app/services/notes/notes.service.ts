import { Injectable } from '@nestjs/common';
import { CreateNoteInput } from './storage/note';
import { NotesRepository } from './storage/notes-repository';

@Injectable()
export class NotesService {
    constructor(private storage: NotesRepository) {}

    createNote(content: CreateNoteInput): string {
        // Simple in-memory note creation logic for demonstration
        return this.storage.createNote(content);
    }

    getNote(id: string) {
        return this.storage.getNote(id);
    }

    getAllNotes() {
        return this.storage.getNotes();
    }

    deleteNote(id: string): boolean {
        return this.storage.deleteNote(id);
    }
}
