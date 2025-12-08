import { Controller, Get } from '@nestjs/common';

@Controller('calendar')
export class CalendarController {
  @Get()
  getCalendarData() {
    // Hardcoded jCal format data for now
    return [
      'vcalendar',
      [
        ['version', {}, 'text', '2.0'],
        ['prodid', {}, 'text', '-//FreqFrame//Calendar//EN']
      ],
      [
        [
          'vevent',
          [
            ['uid', {}, 'text', 'event-001'],
            ['summary', {}, 'text', 'Ham Radio Net'],
            ['dtstart', {}, 'date-time', '2025-01-15T19:00:00Z'],
            ['dtend', {}, 'date-time', '2025-01-15T20:00:00Z']
          ],
          []
        ]
      ]
    ];
  }
}