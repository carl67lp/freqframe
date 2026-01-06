import { Note, CreateNoteInput } from './note';
import Database from 'better-sqlite3';

export class NotesRepository {
    private db: Database.Database;
    constructor(private dbPath: string) {
        this.db = new Database(dbPath);

        // In the event that the notes table does not exist, create it
        const createTable = this.db.prepare(
            `CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                author TEXT NOT NULL,
                content TEXT NOT NULL,
                createdAt TEXT NOT NULL,
                expiresAt TEXT
            )`
        );
        createTable.run();
    }

    createNote(note: CreateNoteInput): string {
        const id = crypto.randomUUID();
        const author = note.author;
        const createdAt = new Date().toISOString();
        const expiresAt = note.expiresAt ? note.expiresAt : null;
        const content = note.content;
        const insert = this.db.prepare(
            'INSERT INTO notes (id, author, content, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?)'
        );
        const info = insert.run(id, author, content, createdAt, expiresAt);
        if (info.changes === 1) {
            return id;
        } else {
            throw new Error('Failed to create note');
        }
    }

    getNote(id: string): Note | null {
        const select = this.db.prepare('SELECT * FROM notes WHERE id = ?');
        const row = select.get(id) as Note | undefined;
        if (row) {
            return {
                id: row.id,
                author: row.author,
                content: row.content,
                createdAt: row.createdAt,
                expiresAt: row.expiresAt,
            };
        } else {
            return null;
        }
    }

    getNotes(): Note[] {
        const select = this.db.prepare('SELECT * FROM notes');
        const rows = select.all();
        return rows.map((row) => ({
            id: row.id,
            author: row.author,
            content: row.content,
            createdAt: row.createdAt,
            expiresAt: row.expiresAt,
        }));
    }

    deleteNote(id: string): boolean {
        const del = this.db.prepare('DELETE FROM notes WHERE id = ?');
        const info = del.run(id);
        return info.changes === 1;
    }
}
