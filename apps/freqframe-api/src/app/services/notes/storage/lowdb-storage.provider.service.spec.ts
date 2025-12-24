import { Test, TestingModule } from '@nestjs/testing';
import { LowdbStorageProviderService } from './lowdb-storage.provider.service';
import { Note } from './note';

// Mock the lowdb/node module
jest.mock('lowdb/node', () => ({
    JSONFilePreset: jest.fn().mockResolvedValue({
        data: { notes: [] },
        read: jest.fn(),
        write: jest.fn(),
    }),
}));

describe('LowdbStorageProviderService', () => {
    let service: LowdbStorageProviderService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [LowdbStorageProviderService],
        }).compile();

        service = module.get<LowdbStorageProviderService>(
            LowdbStorageProviderService
        );
        await service.onModuleInit(); // Initialize the db
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('set and get', () => {
        it('should store and retrieve a note', async () => {
            const note: Note = {
                id: '1',
                author: 'Alice',
                content: 'Test note',
                createdAt: new Date().toISOString(),
            };
            await service.set(note.id, note);
            const retrievedNote = await service.get<Note>(note.id);
            expect(retrievedNote).toEqual(note);
        });
    });
});
