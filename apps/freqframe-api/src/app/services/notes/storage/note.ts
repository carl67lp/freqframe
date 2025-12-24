export interface Note {
    id: string;
    author: string;
    content: string;
    createdAt: string;
    expiresAt?: string;
}

export interface Notes {
    notes: Note[];
}
