import { NotesRepository } from './notes-repository';
import { Note, CreateNoteInput } from './note';

describe('NotesRepository', () => {
    let repository: NotesRepository;
    beforeEach(async () => {
        repository = new NotesRepository(':memory:');
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('createNote', () => {
        it('should create a note', async () => {
            const testNote: CreateNoteInput = {
                author: 'test-author',
                content: 'This is a test note',
                expiresAt: undefined,
            };
            const note = repository.createNote(testNote);
            // Verify that the ID is returned
            expect(note).toBeDefined();
            expect(typeof note).toBe('string');
            const retrievedNote = repository.getNote(note);
            expect(retrievedNote).toBeDefined();
            expect(retrievedNote?.content).toBe(testNote.content);
        });
    });
    describe('getNote', () => {
        it('should retrieve a note by ID', async () => {
            const testNote: CreateNoteInput = {
                author: 'test-author',
                content: 'This is a test note',
                expiresAt: undefined,
            };
            const noteId = repository.createNote(testNote);
            const retrievedNote = repository.getNote(noteId);
            expect(retrievedNote).toBeDefined();
            expect(retrievedNote?.id).toBe(noteId);
            expect(retrievedNote?.content).toBe(testNote.content);
        });
    });

    describe('getNotes', () => {
        it('should retrieve all notes', async () => {
            const testNote1: CreateNoteInput = {
                author: 'test-author-1',
                content: 'This is the first test note',
                expiresAt: undefined,
            };
            const testNote2: CreateNoteInput = {
                author: 'test-author-2',
                content: 'This is the second test note',
                expiresAt: undefined,
            };
            repository.createNote(testNote1);
            repository.createNote(testNote2);
            const notes = repository.getNotes();
            expect(notes.length).toBeGreaterThanOrEqual(2);
            expect(
                notes.some((note) => note.content === testNote1.content)
            ).toBe(true);
            expect(
                notes.some((note) => note.content === testNote2.content)
            ).toBe(true);
        });
        it('should return an empty array when there are no notes', async () => {
            const notes = repository.getNotes();
            expect(notes).toEqual([]);
        });
    });

    describe('deleteNote', () => {
        it('should delete a note', async () => {
            const testNote: CreateNoteInput = {
                author: 'test-author',
                content: 'This note will be deleted',
                expiresAt: undefined,
            };
            const noteId = repository.createNote(testNote);
            const deleted = repository.deleteNote(noteId);
            expect(deleted).toBe(true);
            const retrievedNote = repository.getNote(noteId);
            expect(retrievedNote).toBeNull();
        });
        it('should return false when deleting a non-existent note', async () => {
            const deleted = repository.deleteNote('non-existent-id');
            expect(deleted).toBe(false);
        });
    });
});
