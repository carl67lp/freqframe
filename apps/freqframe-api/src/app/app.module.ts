import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CalendarsController } from './calendars/calendars.controller';
import { ConfigModule } from '@nestjs/config';
import { CalendarService } from './services/calendar/calendar.service';
import calendarsConfig from './config/calendars.config';
import { CaldavService } from './services/calendar/caldav';
import { NotesController } from './notes/notes.controller';
import { NotesService } from './services/notes/notes.service';
import { LowdbStorageProviderService } from './services/notes/storage/lowdb-storage.provider.service';

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
        LowdbStorageProviderService,
    ],
})
export class AppModule {}
