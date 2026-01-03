import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(CalendarService.name);
  private readonly calendars: CalendarsConfig;
  private readonly caldav: CaldavService;

  constructor(
    private readonly configService: ConfigService,
    private readonly caldavService: CaldavService
  ) {
    this.calendars = this.configService.get<CalendarsConfig>('calendars') || {};
    this.caldav = caldavService;
  }

  async getCalendarList(): Promise<string[]> {
    return Object.keys(this.calendars);
  }

  async getCalendarEvents(
    calendarName?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ status: number; events: CalendarEvent[] }> {
    // If no calendar specified, get all calendars
    if (!calendarName) {
      return this.getAllCalendarEvents(startDate, endDate);
    }

    // Otherwise get specific calendar
    if (!this.calendars[calendarName]) {
      throw new HttpException(
        `Unknown calendar: ${calendarName}`,
        HttpStatus.BAD_REQUEST
      );
    }
    return this.caldav.getCalendarEvents(calendarName, startDate, endDate);
  }

  async getAllCalendarEvents(
    startDate?: Date,
    endDate?: Date
  ): Promise<{ status: number; events: CalendarEvent[] }> {
    const calendarNames = Object.keys(this.calendars);
    this.logger.log({
      action: 'fetch_all_calendars',
      calendarCount: calendarNames.length,
      calendars: calendarNames,
      startDate: startDate?.toISOString() || null,
      endDate: endDate?.toISOString() || null,
      timestamp: new Date().toISOString(),
    });

    const allEvents: CalendarEvent[] = [];
    for (const calendarName of calendarNames) {
      const { events } = await this.caldav.getCalendarEvents(
        calendarName,
        startDate,
        endDate
      );
      this.logger.log({
        action: 'calendar_fetched',
        calendar: calendarName,
        eventCount: events.length,
        timestamp: new Date().toISOString(),
      });
      allEvents.push(...events);
    }

    // Sort events by start date
    allEvents.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    this.logger.log({
      action: 'fetch_complete',
      totalEvents: allEvents.length,
      timestamp: new Date().toISOString(),
    });
    return { status: 200, events: allEvents };
  }
}
