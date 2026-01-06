import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    Post,
} from '@nestjs/common';
import { NotesService } from '../services/notes/notes.service';
import { CreateNoteInput, Note } from '../services/notes/storage/note';

@Controller('notes')
export class NotesController {
    constructor(private readonly notesService: NotesService) {}

    private prepNoteInput(noteInput: CreateNoteInput): CreateNoteInput {
        // TODO: Translate the incoming phone number to a user name
        return noteInput;
    }

    @Get(':id')
    async getNote(@Param('id') id: string): Promise<Note> {
        return this.notesService.getNote(id);
    }

    @Get()
    async getAllNotes(): Promise<Note[]> {
        return this.notesService.getAllNotes();
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
