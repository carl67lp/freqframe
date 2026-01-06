import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CalendarsController } from './calendars/calendars.controller';
import { ConfigModule } from '@nestjs/config';
import { CalendarService } from './services/calendar/calendar.service';
import calendarsConfig from './config/calendars.config';
import { CaldavService } from './services/calendar/caldav';
import { NotesService } from './services/notes/notes.service';
import { NotesController } from './notes/notes.controller';
import { NotesRepository } from './services/notes/storage/notes-repository';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['apps/api/.env.development', 'apps/api/.env'],
            load: [calendarsConfig],
        }),
    ],
    controllers: [AppController, CalendarsController, NotesController],
    providers: [
        AppService,
        CalendarService,
        CaldavService,
        NotesService,
        {
            provide: NotesRepository,
            useFactory: () => new NotesRepository('./db/notes.db'),
        },
    ],
})
export class AppModule {}
