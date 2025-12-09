import { Controller, Get, Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import base64 from 'base-64';
import ICAL from 'ical.js';
import { env } from 'process';

@Injectable()
@Controller('calendar')
export class CalendarController {
  constructor(private readonly config: ConfigService) {}
  private readonly calendars = this.config.get('calendars');
  private readonly username = this.config.get<string>('CALDAV_USERNAME');
  private readonly password = this.config.get<string>('CALDAV_PASSWORD');

  REPORT_BODY = `
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
      <c:comp-filter name="VEVENT"/>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>
`.trim();

  @Get()
  async getCalendarData() {
    const auth = Buffer.from(`${this.username}:${this.password}`).toString(
      'base64'
    );

    const response = await fetch(this.calendars[0].url, {
      method: 'REPORT',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/xml',
        Depth: '1',
      },
      body: this.REPORT_BODY,
    });

    const text = await response.text();

    console.log('status', response.status);
    //console.log('headers', Object.fromEntries(response.headers.entries()));
    console.log('body', text);

    return {
      status: response.status,
      body: text,
    };
  }
}
