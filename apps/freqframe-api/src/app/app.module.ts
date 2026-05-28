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
            envFilePath: ['apps/api/.env.development', 'apps/api/.env'],
            load: [calendarsConfig],
        }),
    ],
    controllers: [AppController, CalendarsController],
    providers: [AppService, CalendarService, CaldavService],
})
export class AppModule {}
