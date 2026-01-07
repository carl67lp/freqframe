import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    Post,
    UseGuards,
} from '@nestjs/common';
import { NotesService } from '../services/notes/notes.service';
import { CreateNoteInput, Note } from '../services/notes/storage/note';
import { ApiKeyGuard } from '../guards/api-key.guard';

@Controller('notes')
@UseGuards(ApiKeyGuard)
export class NotesController {
    constructor(private readonly notesService: NotesService) {}

    private prepNoteInput(noteInput: CreateNoteInput): CreateNoteInput {
        // TODO: Translate the incoming phone number to a user name
        noteInput.expiresAt = new Date(
            Date.now() + 12 * 60 * 60 * 1000
        ).toISOString(); // 12 hours from now
        return noteInput;
    }

    @Get(':id')
    async getNote(@Param('id') id: string): Promise<Note> {
        return this.notesService.getNote(id);
    }

    @Get()
    async getAllNotes(): Promise<Note[]> {
        const allNotes: Note[] = await this.notesService.getAllNotes();
        // Return only those notes that have not expired
        const now = new Date();
        return allNotes.filter((note) => {
            if (note.expiresAt) {
                return new Date(note.expiresAt) > now;
            }
            return true; // No expiration means it's valid
        });
    }

    @Post()
    @HttpCode(201)
    async createNote(
        @Body() noteInput: CreateNoteInput
    ): Promise<{ id: string }> {
        const preppedNote = this.prepNoteInput(noteInput);
        const createdNote = await this.notesService.createNote(preppedNote);
        if (typeof createdNote === 'string') {
            return { id: createdNote };
        }
        throw new Error('Note creation failed');
    }

    @Delete(':id')
    @HttpCode(204)
    async deleteNote(@Param('id') id: string): Promise<void> {
        this.notesService.deleteNote(id);
    }
}
