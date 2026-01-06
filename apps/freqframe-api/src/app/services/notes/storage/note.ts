export interface Note {
    id: string;
    author: string;
    content: string;
    createdAt: string;
    expiresAt?: string;
}

// Input for creating a new note (before it has an ID/timestamp)
export type CreateNoteInput = Omit<Note, 'id' | 'createdAt'>;

export interface Notes {
    notes: Note[];
}
