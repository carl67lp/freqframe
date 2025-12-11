import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { CalendarService } from '../services/calendar/calendar.service';
import ICAL from 'ical.js';
import { parseStringPromise } from 'xml2js';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  async getCalendarData(@Query('name') calendarName = 'Home') {
    try {
      // Fetch raw calendar multistatus XML from service
      const { status, body } = await this.calendarService.getCalendarData(calendarName);

      // Parse XML to extract individual <calendar-data> ICS blocks
      const xml = await parseStringPromise(body, {
        explicitArray: true,
        tagNameProcessors: [ (name) => name.replace(/^.*:/, '') ], // remove namespace
        ignoreAttrs: true,
      });

      const responses = xml['multistatus']?.['response'] || [];
      const icsList: string[] = [];

      for (const res of responses) {
        const propstats = res['propstat'] || [];
        for (const ps of propstats) {
          const calendarData = ps['prop']?.[0]['calendar-data']?.[0];
          if (calendarData) {
            icsList.push(calendarData);
          }
        }
      }

      if (icsList.length === 0) {
        return { status, events: [] };
      }

      // Parse each ICS block with ICAL.js
      const events = icsList.flatMap((ics) => {
        const jcalData = ICAL.parse(ics);
        const vcalendar = new ICAL.Component(jcalData);
        return vcalendar.getAllSubcomponents('vevent').map((vevent) => {
          const event = new ICAL.Event(vevent);
          return {
            summary: event.summary,
            description: event.description,
            location: event.location,
            start: event.startDate.toString(),
            end: event.endDate.toString(),
            uid: event.uid,
          };
        });
      });

      return { status, events };
    } catch (error) {
      console.error('Calendar parse error:', error);
      throw new HttpException(
        `Failed to fetch or parse calendar data: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
