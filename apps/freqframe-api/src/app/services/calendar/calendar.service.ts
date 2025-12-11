import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CalendarConfig {
  url: string;
  description?: string;
}
type CalendarsConfig = Record<string, CalendarConfig>;

@Injectable()
export class CalendarService {
  constructor(private readonly config: ConfigService) {}
  private readonly calendars: CalendarsConfig = this.config.get('calendars');
  private readonly username =
    this.config.get<string>('CALDAV_USERNAME') ??
    (() => {
      throw new Error('Missing CALDAV_USERNAME');
    })();
  private readonly password =
    this.config.get<string>('CALDAV_PASSWORD') ??
    (() => {
      throw new Error('Missing CALDAV_PASSWORD');
    })();


  async getCalendarData(calendarName: string,
    options?: { startDate?: Date; endDate?: Date }
  ): Promise<{ status: number; body: string }> {
    if (!this.calendars[calendarName]) {
      throw new HttpException(`Unknown calendar: ${calendarName}`, HttpStatus.BAD_REQUEST);
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
