import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CaldavService } from './caldav';
import { HttpException } from '@nestjs/common';

describe('CaldavService', () => {
  let service: CaldavService;
  let configService: ConfigService;

  const mockCalendarsConfig = {
    Alice: { url: 'https://caldav.example.com/alice/', description: "Alice's Calendar" },
    Bob: { url: 'https://caldav.example.com/bob/', description: "Bob's Calendar" },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaldavService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'calendars') return mockCalendarsConfig;
              if (key === 'CALDAV_USERNAME') return 'testuser';
              if (key === 'CALDAV_PASSWORD') return 'testpass';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CaldavService>(CaldavService);
    configService = module.get<ConfigService>(ConfigService);

    // Clear mocks after each test
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should load calendars config from ConfigService', () => {
      expect(service).toBeDefined();
      expect(configService.get).toHaveBeenCalledWith('calendars');
    });

    it('should load CALDAV_USERNAME and CALDAV_PASSWORD from environment', () => {
      expect(configService.get).toHaveBeenCalledWith('CALDAV_USERNAME');
      expect(configService.get).toHaveBeenCalledWith('CALDAV_PASSWORD');
    });

    it('should throw error if CALDAV_USERNAME is missing', () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'calendars') return mockCalendarsConfig;
        if (key === 'CALDAV_USERNAME') return undefined;
        return undefined;
      });

      expect(
        () =>
          new CaldavService(configService)
      ).toThrow('Missing CALDAV_USERNAME');
    });

    it('should throw error if CALDAV_PASSWORD is missing', () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'calendars') return mockCalendarsConfig;
        if (key === 'CALDAV_USERNAME') return 'user';
        if (key === 'CALDAV_PASSWORD') return undefined;
        return undefined;
      });

      expect(
        () =>
          new CaldavService(configService)
      ).toThrow('Missing CALDAV_PASSWORD');
    });
  });

  describe('getRawXmlData', () => {
    it('should throw error for unknown calendar', async () => {
      await expect(service.getRawXmlData('Unknown')).rejects.toThrow(
        'Unknown calendar: Unknown'
      );
    });

    it('should use basic auth with credentials from config', async () => {
      const mockFetch = jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce({
        status: 207,
        text: jest.fn().mockResolvedValue('<multistatus/>'),
      });

      await service.getRawXmlData('Alice');

      const callArgs = mockFetch.mock.calls[0] as any[];
      const authHeader = callArgs[1]?.headers?.Authorization;
      expect(authHeader).toContain('Basic');
    });

    it('should include calendar URL from config', async () => {
      const mockFetch = jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce({
        status: 207,
        text: jest.fn().mockResolvedValue('<multistatus/>'),
      });

      await service.getRawXmlData('Alice');

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toBe('https://caldav.example.com/alice/');
    });

    it('should set REPORT method and correct headers', async () => {
      const mockFetch = jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce({
        status: 207,
        text: jest.fn().mockResolvedValue('<multistatus/>'),
      });

      await service.getRawXmlData('Alice');

      const callArgs = mockFetch.mock.calls[0] as any[];
      const headers = callArgs[1];
      expect(headers.method).toBe('REPORT');
      expect(headers.headers['Content-Type']).toBe('application/xml');
      expect(headers.headers['Depth']).toBe('1');
    });

    it('should include date range in request body', async () => {
      const mockFetch = jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce({
        status: 207,
        text: jest.fn().mockResolvedValue('<multistatus/>'),
      });

      const startDate = new Date('2024-12-01T00:00:00Z');
      const endDate = new Date('2024-12-31T23:59:59Z');
      
      await service.getRawXmlData('Alice', { startDate, endDate });

      const callArgs = mockFetch.mock.calls[0] as any[];
      expect(callArgs[1].body).toContain('20241201');
      expect(callArgs[1].body).toContain('20241231');
    });

    it('should handle network errors', async () => {
      jest.spyOn(global, 'fetch' as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getRawXmlData('Alice')).rejects.toThrow(
        'Failed to fetch calendar data'
      );
    });

    it('should return status and body from response', async () => {
      const mockBody = '<test>response</test>';
      jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce({
        status: 207,
        text: jest.fn().mockResolvedValue(mockBody),
      });

      const result = await service.getRawXmlData('Alice');

      expect(result.status).toBe(207);
      expect(result.body).toBe(mockBody);
    });
  });

  describe('getCalendarEvents', () => {
    it('should throw error for unknown calendar', async () => {
      await expect(service.getCalendarEvents('Unknown')).rejects.toThrow(
        HttpException
      );
    });

    it('should parse and return calendar events', async () => {
      const mockXml = `<?xml version="1.0" encoding="utf-8"?>
<multistatus xmlns="DAV:">
  <response>
    <propstat>
      <prop>
        <getetag>"123"</getetag>
        <calendar-data>BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//EN
BEGIN:VEVENT
UID:event-1
DTSTART:20250101T100000Z
DTEND:20250101T110000Z
SUMMARY:Meeting
END:VEVENT
END:VCALENDAR</calendar-data>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
</multistatus>`;

      jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce({
        status: 207,
        text: jest.fn().mockResolvedValue(mockXml),
      });

      // Use a date range that includes our event
      const result = await service.getCalendarEvents('Alice', new Date('2024-12-01'), new Date('2025-12-31'));

      expect(result.status).toBe(207);
      expect(result.events.length).toBe(1);
      expect(result.events[0].id).toBe('event-1');
      expect(result.events[0].title).toBe('Meeting');
      expect(result.events[0].calendarName).toBe('Alice');
    });

    it('should include calendarName in returned events', async () => {
      const mockXml = `<?xml version="1.0" encoding="utf-8"?>
<multistatus xmlns="DAV:">
  <response>
    <propstat>
      <prop>
        <getetag>"123"</getetag>
        <calendar-data>BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//EN
BEGIN:VEVENT
UID:event-2
DTSTART:20250115T140000Z
DTEND:20250115T150000Z
SUMMARY:Team Sync
END:VEVENT
END:VCALENDAR</calendar-data>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
</multistatus>`;

      jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce({
        status: 207,
        text: jest.fn().mockResolvedValue(mockXml),
      });

      const result = await service.getCalendarEvents('Bob', new Date('2024-12-01'), new Date('2025-12-31'));

      expect(result.events.length).toBe(1);
      expect(result.events[0].calendarName).toBe('Bob');
      expect(result.events[0].title).toBe('Team Sync');
    });

    it('should return empty array when no events found', async () => {
      const emptyXml = `<?xml version="1.0" encoding="utf-8"?>
<multistatus xmlns="DAV:"><response/></multistatus>`;

      jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce({
        status: 207,
        text: jest.fn().mockResolvedValue(emptyXml),
      });

      const result = await service.getCalendarEvents('Alice');

      expect(result.events).toEqual([]);
    });

    it('should mark all-day events correctly', async () => {
      const mockXml = `<?xml version="1.0" encoding="utf-8"?>
<multistatus xmlns="DAV:">
  <response>
    <propstat>
      <prop>
        <getetag>"456"</getetag>
        <calendar-data>BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//EN
BEGIN:VEVENT
UID:allday-1
DTSTART;VALUE=DATE:20250101
DTEND;VALUE=DATE:20250102
SUMMARY:Holiday
END:VEVENT
END:VCALENDAR</calendar-data>
      </prop>
    </propstat>
  </response>
</multistatus>`;

      jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce({
        status: 207,
        text: jest.fn().mockResolvedValue(mockXml),
      });

      const result = await service.getCalendarEvents('Alice', new Date('2024-12-01'), new Date('2025-12-31'));

      expect(result.events[0].allDay).toBe(true);
    });

    it('should mark timed events as not all-day', async () => {
      const mockXml = `<?xml version="1.0" encoding="utf-8"?>
<multistatus xmlns="DAV:">
  <response>
    <propstat>
      <prop>
        <calendar-data>BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//EN
BEGIN:VEVENT
UID:timed-1
DTSTART:20250101T100000Z
DTEND:20250101T110000Z
SUMMARY:Meeting
END:VEVENT
END:VCALENDAR</calendar-data>
      </prop>
    </propstat>
  </response>
</multistatus>`;

      jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce({
        status: 207,
        text: jest.fn().mockResolvedValue(mockXml),
      });

      const result = await service.getCalendarEvents('Alice', new Date('2024-12-01'), new Date('2025-12-31'));

      expect(result.events[0].allDay).toBe(false);
    });

    it('should sort events by start date', async () => {
      const mockXml = `<?xml version="1.0" encoding="utf-8"?>
<multistatus xmlns="DAV:">
  <response>
    <propstat>
      <prop>
        <getetag>"456"</getetag>
        <calendar-data>BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//EN
BEGIN:VEVENT
UID:event-2
DTSTART:20250110T100000Z
DTEND:20250110T110000Z
SUMMARY:Second Event
END:VEVENT
END:VCALENDAR</calendar-data>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
  <response>
    <propstat>
      <prop>
        <getetag>"123"</getetag>
        <calendar-data>BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//EN
BEGIN:VEVENT
UID:event-1
DTSTART:20250105T100000Z
DTEND:20250105T110000Z
SUMMARY:First Event
END:VEVENT
END:VCALENDAR</calendar-data>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
</multistatus>`;

      jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce({
        status: 207,
        text: jest.fn().mockResolvedValue(mockXml),
      });

      const result = await service.getCalendarEvents('Alice', new Date('2024-12-01'), new Date('2025-12-31'));

      expect(result.events.length).toBe(2);
      expect(result.events[0].title).toBe('First Event');
      expect(result.events[1].title).toBe('Second Event');
    });

    it('should continue on individual ICS parse errors', async () => {
      const mockXml = `<?xml version="1.0" encoding="utf-8"?>
<multistatus xmlns="DAV:">
  <response>
    <propstat>
      <prop>
        <getetag>"bad"</getetag>
        <calendar-data>INVALID ICS DATA</calendar-data>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
  <response>
    <propstat>
      <prop>
        <getetag>"good"</getetag>
        <calendar-data>BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//EN
BEGIN:VEVENT
UID:event-1
DTSTART:20250105T100000Z
DTEND:20250105T110000Z
SUMMARY:Valid Event
END:VEVENT
END:VCALENDAR</calendar-data>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
</multistatus>`;

      jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce({
        status: 207,
        text: jest.fn().mockResolvedValue(mockXml),
      });

      const result = await service.getCalendarEvents('Alice', new Date('2024-12-01'), new Date('2025-12-31'));

      // Should skip the invalid ICS and return the valid one
      expect(result.events.length).toBe(1);
      expect(result.events[0].title).toBe('Valid Event');
    });
  });

  describe('window filtering', () => {
    const wrapIcs = (vevent: string) => `<?xml version="1.0" encoding="utf-8"?>
<multistatus xmlns="DAV:">
  <response>
    <propstat>
      <prop>
        <calendar-data>BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//EN
${vevent}
END:VCALENDAR</calendar-data>
      </prop>
    </propstat>
  </response>
</multistatus>`;

    const fetchReturning = (vevent: string) =>
      jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce({
        status: 207,
        text: jest.fn().mockResolvedValue(wrapIcs(vevent)),
      });

    // The dashboard asks for events from "now", so anything that began earlier
    // today must still come back or it vanishes from the pane at midnight.
    const noon = new Date('2025-01-01T12:00:00Z');
    const later = new Date('2025-01-31T00:00:00Z');

    it("should include today's all-day event when the window starts mid-day", async () => {
      fetchReturning(`BEGIN:VEVENT
UID:allday-today
DTSTART;VALUE=DATE:20250101
DTEND;VALUE=DATE:20250102
SUMMARY:New Year's Day
END:VEVENT`);

      const result = await service.getCalendarEvents('Alice', noon, later);

      expect(result.events.map((e) => e.title)).toEqual(["New Year's Day"]);
    });

    it('should include a timed event already in progress', async () => {
      fetchReturning(`BEGIN:VEVENT
UID:in-progress
DTSTART:20250101T090000Z
DTEND:20250101T170000Z
SUMMARY:All Day Offsite
END:VEVENT`);

      const result = await service.getCalendarEvents('Alice', noon, later);

      expect(result.events.map((e) => e.title)).toEqual(['All Day Offsite']);
    });

    it('should exclude an event that already ended', async () => {
      fetchReturning(`BEGIN:VEVENT
UID:finished
DTSTART:20250101T080000Z
DTEND:20250101T090000Z
SUMMARY:Finished Standup
END:VEVENT`);

      const result = await service.getCalendarEvents('Alice', noon, later);

      expect(result.events).toEqual([]);
    });

    it('should include a recurring occurrence already in progress', async () => {
      fetchReturning(`BEGIN:VEVENT
UID:recurring
DTSTART:20250101T090000Z
DTEND:20250101T170000Z
RRULE:FREQ=DAILY;COUNT=5
SUMMARY:Daily Shift
END:VEVENT`);

      const result = await service.getCalendarEvents('Alice', noon, later);

      expect(result.events.length).toBe(5);
      expect(result.events[0].start).toBe('2025-01-01T09:00:00.000Z');
    });

    it('should exclude recurring occurrences that finished before the window', async () => {
      fetchReturning(`BEGIN:VEVENT
UID:recurring-past
DTSTART:20241230T090000Z
DTEND:20241230T100000Z
RRULE:FREQ=DAILY;COUNT=5
SUMMARY:Morning Standup
END:VEVENT`);

      const result = await service.getCalendarEvents('Alice', noon, later);

      // Dec 30, Dec 31 and Jan 1 (ended 10:00) are all over by noon on Jan 1.
      expect(result.events.length).toBe(2);
      expect(result.events[0].start).toBe('2025-01-02T09:00:00.000Z');
    });
  });
});

