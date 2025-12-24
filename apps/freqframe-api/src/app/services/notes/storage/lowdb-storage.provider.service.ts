import { Injectable, OnModuleInit } from '@nestjs/common';
import { Low } from 'lowdb';
import { JSONFilePreset } from 'lowdb/node';
import { StorageProvider } from '../storage/storage.provider';
import { Note, Notes } from './note';
import { join } from 'path';

@Injectable()
export class LowdbStorageProviderService
    implements StorageProvider, OnModuleInit
{
    private db: Low<Notes> | null = null;

    private ensureDb(): Low<Notes> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        return this.db;
    }

    async onModuleInit() {
        const dbPath = join(__dirname, '../../../db/notes.json');
        this.db = await JSONFilePreset<Notes>(dbPath, {
            notes: [],
        });
    }

    async set(key: string, value: Note): Promise<void> {
        const db = this.ensureDb();
        const existingIndex = db.data.notes.findIndex((n) => n.id === key);

        if (existingIndex !== -1) {
            db.data.notes[existingIndex] = value;
        } else {
            db.data.notes.push(value);
        }

        await db.write();
    }

    async get<T = unknown>(key: string): Promise<T | null> {
        const db = this.ensureDb();
        const note = db.data.notes.find((n) => n.id === key);
        return note as T | null;
    }

    async exists(key: string): Promise<boolean> {
        const db = this.ensureDb();
        return db.data.notes.some((n) => n.id === key);
    }

    async delete(): Promise<void> {
        const db = this.ensureDb();
        throw new Error('Method not implemented.');
    }

    async keys(pattern?: string): Promise<string[]> {
        const db = this.ensureDb();
        throw new Error('Method not implemented.');
    }

    async clear(): Promise<void> {
        const db = this.ensureDb();
        throw new Error('Method not implemented.');
    }
}
