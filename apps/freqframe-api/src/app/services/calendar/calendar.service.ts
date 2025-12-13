import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CaldavService } from './caldav';
import { CalendarEvent } from '@freqframe/shared-types';
import { ConfigService } from '@nestjs/config';

interface CalendarConfig {
  url: string;
  description?: string;
}
interface CalendarsConfig {
  [key: string]: CalendarConfig;
}

@Injectable()
export class CalendarService {
  private readonly calendars: CalendarsConfig;
  private readonly caldav: CaldavService;

  constructor(private readonly configService: ConfigService, private readonly caldavService: CaldavService) {
    this.calendars = this.configService.get<CalendarsConfig>('calendars') || {};
    this.caldav = caldavService;
  }

  async getCalendarList(): Promise<string[]> {
    return Object.keys(this.calendars);
  }

  async getCalendarEvents(
    calendarName: string, startDate?: Date, endDate?: Date 
  ): Promise<{ status: number; events: CalendarEvent[] }> {
    if (!this.calendars[calendarName]) {
      throw new HttpException(
        `Unknown calendar: ${calendarName}`,
        HttpStatus.BAD_REQUEST
      );
    }
    return this.caldav.getCalendarEvents(calendarName, startDate, endDate);
  }
}
