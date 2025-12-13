import { Controller, Get, Query, Header } from '@nestjs/common';
import { CalendarService } from '../services/calendar/calendar.service';

@Controller('calendars')
export class CalendarsController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('')
  getAvailableCalendars() {
    return this.calendarService.getCalendarList();
  }

  @Get('events')
  @Header('Access-Control-Allow-Origin', 'http://localhost:4200') // XXX: adjust for deployment
  async getCalendarData(@Query('name') calendarName = 'Home', @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const eventsResponse = await this.calendarService.getCalendarEvents(
      calendarName,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    return eventsResponse;
  }
}
