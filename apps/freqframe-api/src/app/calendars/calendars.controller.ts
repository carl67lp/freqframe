import { Controller, Get, Query, Logger, UseGuards } from '@nestjs/common';
import { CalendarService } from '../services/calendar/calendar.service';
import { ApiKeyGuard } from '../guards/api-key.guard';

@Controller('calendars')
@UseGuards(ApiKeyGuard)
export class CalendarsController {
    private readonly logger = new Logger(CalendarsController.name);

    constructor(private readonly calendarService: CalendarService) {}

    @Get('')
    getAvailableCalendars() {
        this.logger.log({
            endpoint: 'GET /calendars',
            action: 'list_calendars',
            timestamp: new Date().toISOString(),
        });
        return this.calendarService.getCalendarList();
    }

    @Get('events')
    async getCalendarData(
        @Query('name') calendarName?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        this.logger.log({
            endpoint: 'GET /calendars/events',
            calendar: calendarName || 'all',
            startDate: startDate || null,
            endDate: endDate || null,
            timestamp: new Date().toISOString(),
        });

        const eventsResponse = await this.calendarService.getCalendarEvents(
            calendarName ? calendarName : undefined,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined
        );

        this.logger.log({
            endpoint: 'GET /calendars/events',
            action: 'response',
            eventCount: eventsResponse.events.length,
            timestamp: new Date().toISOString(),
        });
        return eventsResponse;
    }
}
