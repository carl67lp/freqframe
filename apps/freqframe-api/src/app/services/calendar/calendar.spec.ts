import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CaldavService } from './caldav';
import { ConfigService } from '@nestjs/config';
import { CalendarEvent } from '@freqframe/shared-types';

describe('CalendarService', () => {
  let service: CalendarService;
  let configService: ConfigService;
  let caldavService: CaldavService;

  // Mock data
  const mockCalendarsConfig = {
    Alice: { url: 'https://example.com/alice', description: "Alice's Calendar" },
    Bob: { url: 'https://example.com/bob', description: "Bob's Calendar" },
    Charlie: { url: 'https://example.com/charlie', description: 'Charlie Calendar' },
  };

  const mockAliceEvents: CalendarEvent[] = [
    {
      id: 'a1',
      title: 'Dentist Appointment',
      start: '2024-12-15T09:00:00Z',
      end: '2024-12-15T10:00:00Z',
      allDay: false,
    },
    {
      id: 'a2',
      title: 'Birthday Party',
      start: '2024-12-20T18:00:00Z',
      end: '2024-12-20T22:00:00Z',
      allDay: false,
    },
  ];

  const mockBobEvents: CalendarEvent[] = [
    {
      id: 'b1',
      title: 'Soccer Practice',
      start: '2024-12-16T16:00:00Z',
      end: '2024-12-16T17:00:00Z',
      allDay: false,
    },
  ];

  const mockCharlieEvents: CalendarEvent[] = [
    {
      id: 'c1',
      title: 'Holiday',
      start: '2024-12-25T00:00:00Z',
      end: '2024-12-26T00:00:00Z',
      allDay: true,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'calendars') return mockCalendarsConfig;
              return undefined;
            }),
          },
        },
        {
          provide: CaldavService,
          useValue: {
            getCalendarEvents: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
    configService = module.get<ConfigService>(ConfigService);
    caldavService = module.get<CaldavService>(CaldavService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCalendarList', () => {
    it('should return list of configured calendars', async () => {
      const result = await service.getCalendarList();

      expect(result).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should return empty array when no calendars configured', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);
      // Need to create a new service instance with the mocked config
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CalendarService,
          {
            provide: ConfigService,
            useValue: { get: jest.fn().mockReturnValue(undefined) },
          },
          {
            provide: CaldavService,
            useValue: { getCalendarEvents: jest.fn() },
          },
        ],
      }).compile();

      const newService = module.get<CalendarService>(CalendarService);
      const result = await newService.getCalendarList();

      expect(result).toEqual([]);
    });
  });

  describe('getCalendarEvents', () => {
    it('should return events for specific calendar', async () => {
      jest
        .spyOn(caldavService, 'getCalendarEvents')
        .mockResolvedValue({ status: 200, events: mockAliceEvents });

      const result = await service.getCalendarEvents('Alice');

      expect(result.events).toEqual(mockAliceEvents);
      expect(result.status).toBe(200);
      expect(caldavService.getCalendarEvents).toHaveBeenCalledWith('Alice', undefined, undefined);
    });

    it('should pass date parameters to caldav service', async () => {
      const startDate = new Date('2024-12-01');
      const endDate = new Date('2024-12-31');
      jest
        .spyOn(caldavService, 'getCalendarEvents')
        .mockResolvedValue({ status: 200, events: mockAliceEvents });

      await service.getCalendarEvents('Alice', startDate, endDate);

      expect(caldavService.getCalendarEvents).toHaveBeenCalledWith('Alice', startDate, endDate);
    });

    it('should throw error for unknown calendar', async () => {
      const unknownCalendarError = new HttpException(
        'Unknown calendar: Invalid',
        HttpStatus.BAD_REQUEST
      );

      await expect(service.getCalendarEvents('Invalid')).rejects.toThrow('Unknown calendar: Invalid');
    });

    it('should call getAllCalendarEvents when no calendar name specified', async () => {
      jest.spyOn(service, 'getAllCalendarEvents').mockResolvedValue({
        status: 200,
        events: [...mockAliceEvents, ...mockBobEvents],
      });

      const result = await service.getCalendarEvents();

      expect(service.getAllCalendarEvents).toHaveBeenCalled();
    });
  });

  describe('getAllCalendarEvents', () => {
    it('should return combined events from all calendars', async () => {
      jest
        .spyOn(caldavService, 'getCalendarEvents')
        .mockResolvedValueOnce({ status: 200, events: mockAliceEvents })
        .mockResolvedValueOnce({ status: 200, events: mockBobEvents })
        .mockResolvedValueOnce({ status: 200, events: mockCharlieEvents });

      const result = await service.getAllCalendarEvents();

      expect(result.events.length).toBe(4);  // 2 + 1 + 1 = 4 events
      expect(result.status).toBe(200);
      expect(caldavService.getCalendarEvents).toHaveBeenCalledTimes(3);
    });

    it('should sort events by start date', async () => {
      const unsortedEvents = [mockAliceEvents[1], mockCharlieEvents[0], mockAliceEvents[0]];

      jest
        .spyOn(caldavService, 'getCalendarEvents')
        .mockResolvedValueOnce({ status: 200, events: [unsortedEvents[0]] })
        .mockResolvedValueOnce({ status: 200, events: [unsortedEvents[1]] })
        .mockResolvedValueOnce({ status: 200, events: [unsortedEvents[2]] });

      const result = await service.getAllCalendarEvents();

      // Events should be sorted: Alice dentist (Dec 15), Alice party (Dec 20), Charlie holiday (Dec 25)
      expect(result.events[0].title).toBe('Dentist Appointment');
      expect(result.events[1].title).toBe('Birthday Party');
      expect(result.events[2].title).toBe('Holiday');
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-12-16');
      const endDate = new Date('2024-12-20');

      jest
        .spyOn(caldavService, 'getCalendarEvents')
        .mockResolvedValueOnce({ status: 200, events: mockAliceEvents })
        .mockResolvedValueOnce({ status: 200, events: mockBobEvents })
        .mockResolvedValueOnce({ status: 200, events: [] });

      await service.getAllCalendarEvents(startDate, endDate);

      expect(caldavService.getCalendarEvents).toHaveBeenCalledWith('Alice', startDate, endDate);
      expect(caldavService.getCalendarEvents).toHaveBeenCalledWith('Bob', startDate, endDate);
      expect(caldavService.getCalendarEvents).toHaveBeenCalledWith('Charlie', startDate, endDate);
    });

    it('should return empty array when no events found', async () => {
      jest
        .spyOn(caldavService, 'getCalendarEvents')
        .mockResolvedValue({ status: 200, events: [] });

      const result = await service.getAllCalendarEvents();

      expect(result.events).toEqual([]);
      expect(result.status).toBe(200);
    });

    it('should handle errors from caldav service', async () => {
      jest
        .spyOn(caldavService, 'getCalendarEvents')
        .mockRejectedValue(new Error('CalDAV server error'));

      await expect(service.getAllCalendarEvents()).rejects.toThrow('CalDAV server error');
    });
  });
});

