import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseStringPromise } from 'xml2js';
import { CalendarEvent } from '@freqframe/shared-types';
import ICAL from 'ical.js';

interface CalendarConfig {
  url: string;
  description?: string;
}
type CalendarsConfig = Record<string, CalendarConfig>;

@Injectable()
export class CaldavService {
  private readonly calendars: CalendarsConfig;
  private readonly username: string;
  private readonly password: string;

  constructor(private readonly configService: ConfigService) {
    this.calendars = this.configService.get<CalendarsConfig>('calendars') || {};
    this.username =
      this.configService.get<string>('CALDAV_USERNAME') ??
      (() => {
        throw new Error('Missing CALDAV_USERNAME');
      })();
    this.password =
      this.configService.get<string>('CALDAV_PASSWORD') ??
      (() => {
        throw new Error('Missing CALDAV_PASSWORD');
      })();
  }

  async getCalendarEvents(calendarName: string,
    startDate?: Date, endDate?: Date
  ): Promise<{ status: number; events: CalendarEvent[] }> {
    try {
      console.log(`Fetching calendar events for '${calendarName}' from CalDAV service...`);
      // Fetch raw calendar multistatus XML from service
      const { status, body } = await this.getRawXmlData(calendarName, {
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
                calendarName: calendarName,
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
                  calendarName: calendarName,
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

  async getRawXmlData(calendarName: string,
    options?: { startDate?: Date; endDate?: Date }
  ): Promise<{ status: number; body: string }> {
    // Verify the calendar is in the config file
    if (!this.calendars[calendarName]) {
      throw new Error(`Unknown calendar: ${calendarName}`);
    }

    const start = options?.startDate ?? new Date(); // default: now
    const end = options?.endDate ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // default: +90 days
    const startISO = start.toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z';
    const endISO = end.toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z';

    const reportBody = `
  <?xml version="1.0" encoding="UTF-8"?>
  <c:calendar-query
    xmlns:c="urn:ietf:params:xml:ns:caldav"
    xmlns:d="DAV:">
    <d:prop>
      <d:getetag/>
      <c:calendar-data/>
    </d:prop>
    <c:filter>
      <c:comp-filter name="VCALENDAR">
        <c:comp-filter name="VEVENT">
          <c:time-range start="${startISO}" end="${endISO}"/>
        </c:comp-filter>
      </c:comp-filter>
    </c:filter>
  </c:calendar-query>
  `.trim();

    try {
      const auth = Buffer.from(`${this.username}:${this.password}`).toString(
        'base64'
      );
      const response = await fetch(this.calendars[calendarName].url, {
        method: 'REPORT',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/xml',
          Depth: '1',
        },
        body: reportBody,
      });
      const text = await response.text();

      return {
        status: response.status,
        body: text,
      };
    } catch (error) {
      throw new Error(`Failed to fetch calendar data: ${error}`);
    }
  }
}
