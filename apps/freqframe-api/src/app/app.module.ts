import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CalendarsController } from './calendars/calendars.controller';
import { ConfigModule } from '@nestjs/config';
import { CalendarService } from './services/calendar/calendar.service';
import calendarsConfig from './config/calendars.config';
import { CaldavService } from './services/calendar/caldav';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            // The app lives at apps/freqframe-api; the old 'apps/api/...' paths
            // never resolved, so these files were silently ignored.
            envFilePath: [
                'apps/freqframe-api/.env.development',
                'apps/freqframe-api/.env',
                '.env',
            ],
            load: [calendarsConfig],
        }),
    ],
    controllers: [AppController, CalendarsController],
    providers: [AppService, CalendarService, CaldavService],
})
export class AppModule {}
