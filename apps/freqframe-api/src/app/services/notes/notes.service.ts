import { Injectable } from '@nestjs/common';

@Injectable()
export class NotesService {
    constructor(private storage: StorageProvider) {}

    createNote(content: string): { id: number; content: string } {
        // Simple in-memory note creation logic for demonstration
        const note = { id: Date.now(), content };
        return note;
    }
}
