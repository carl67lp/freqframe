import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CalendarController } from './calendar/calendar.controller';
import { ConfigModule } from '@nestjs/config';
import calendarsConfig from './config/calendars.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        'apps/api/.env.development',
        'apps/api/.env',
      ],
      load: [calendarsConfig],
    }),
  ],
  controllers: [AppController, CalendarController],
  providers: [AppService],
})
export class AppModule {}
