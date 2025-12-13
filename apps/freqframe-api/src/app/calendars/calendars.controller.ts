import { Controller, Get, Query } from '@nestjs/common';
import { CalendarService } from '../services/calendar/calendar.service';

@Controller('calendars')
export class CalendarsController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('')
  getAvailableCalendars() {
    return this.calendarService.getCalendarList();
  }

  @Get('events')
  async getCalendarData(
            @Query('name') calendarName?: string,
            @Query('startDate') startDate?: string,
            @Query('endDate') endDate?: string) {
    const eventsResponse = await this.calendarService.getCalendarEvents(
      calendarName ? calendarName : undefined,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    return eventsResponse;
  }
}
