import { Controller, Get, Query, HttpException, HttpStatus, Header } from '@nestjs/common';
import { CalendarService } from '../services/calendar/calendar.service';
import { parseStringPromise } from 'xml2js';
import { CalendarEvent } from '@freqframe/shared-types';
import ICAL from 'ical.js';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  @Header('Access-Control-Allow-Origin', 'http://localhost:4200')
  async getCalendarData(@Query('name') calendarName = 'Home', @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    try {
      // Fetch raw calendar multistatus XML from service
      const { status, body } = await this.calendarService.getCalendarData(calendarName, {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

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

      // Parse and expand recurring events
      const expandStartDate = startDate ? new Date(startDate) : new Date();
      const expandEndDate = endDate ? new Date(endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

      const events: CalendarEvent[] = [];

      for (const ics of icsList) {
        try {
          const jcal = ICAL.parse(ics);
          const comp = new ICAL.Component(jcal);
          const vevent = comp.getFirstSubcomponent('vevent');

          if (!vevent) continue;

          // Create event object from component
          const event = new ICAL.Event(vevent);
          
          // Check if recurring
          const rrule = vevent.getFirstPropertyValue('rrule');
          
          if (!rrule) {
            // Non-recurring event
            const startTime = event.startDate.toJSDate();
            if (startTime >= expandStartDate && startTime <= expandEndDate) {
              events.push({
                id: event.uid,
                title: event.summary || 'Untitled',
                description: event.description,
                location: event.location,
                start: event.startDate.toJSDate().toISOString(),
                end: event.endDate?.toJSDate().toISOString(),
                allDay: event.startDate.icaltype === 'date',
              });
            }
          } else {
            // Recurring event - expand instances
            const iter = event.iterator();
            let occurrence = iter.next();

            while (occurrence) {
              const occStart = occurrence.toJSDate();
              if (occStart > expandEndDate) break; // Stop if past end date
              
              if (occStart >= expandStartDate) {
                const occEnd = occurrence.clone();
                if (event.endDate) {
                  const duration = event.endDate.toJSDate().getTime() - event.startDate.toJSDate().getTime();
                  occEnd.addDuration(ICAL.Duration.fromSeconds(Math.floor(duration / 1000)));
                }

                events.push({
                  id: `${event.uid}-${occStart.getTime()}`,
                  title: event.summary || 'Untitled',
                  description: event.description,
                  location: event.location,
                  start: occStart.toISOString(),
                  end: occEnd.toJSDate().toISOString(),
                  allDay: event.startDate.icaltype === 'date',
                  isRecurring: true,
                });
              }
              
              occurrence = iter.next();
            }
          }
        } catch (parseError) {
          console.warn(`Failed to parse/expand ICS block: ${parseError}`);
          // Continue with next ICS block instead of failing
        }
      }

      // Sort by start date
      events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

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
