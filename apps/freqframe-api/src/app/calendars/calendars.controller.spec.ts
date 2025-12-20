import { Test, TestingModule } from '@nestjs/testing';
import { CalendarsController } from './calendars.controller';
import { CalendarService } from '../services/calendar/calendar.service';
import { CalendarEvent } from '@freqframe/shared-types';

describe('CalendarsController', () => {
  let controller: CalendarsController;
  let service: CalendarService;

  // Mock calendar event data
  const mockEvents: CalendarEvent[] = [
    {
      id: '1',
      calendarName: 'Alice',
      title: 'Team Meeting',
      description: 'Weekly sync',
      location: 'Conference Room A',
      start: '2024-12-15T10:00:00Z',
      end: '2024-12-15T11:00:00Z',
      allDay: false,
    },
    {
      id: '2',
      calendarName: 'Bob',
      title: 'Holiday',
      start: '2024-12-25T00:00:00Z',
      end: '2024-12-26T00:00:00Z',
      allDay: true,
    },
  ];

  // Mock service response
  const mockServiceResponse = {
    status: 200,
    events: mockEvents,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalendarsController],
      providers: [
        {
          provide: CalendarService,
          useValue: {
            getCalendarList: jest.fn(),
            getCalendarEvents: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CalendarsController>(CalendarsController);
    service = module.get<CalendarService>(CalendarService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailableCalendars', () => {
    it('should return a list of available calendars', async () => {
      const mockCalendarList = ['Alice', 'Bob', 'Charlie', 'Shared', 'Work'];
      jest.spyOn(service, 'getCalendarList').mockResolvedValue(mockCalendarList);

      const result = await controller.getAvailableCalendars();

      expect(result).toEqual(mockCalendarList);
      expect(service.getCalendarList).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array if no calendars configured', async () => {
      jest.spyOn(service, 'getCalendarList').mockResolvedValue([]);

      const result = await controller.getAvailableCalendars();

      expect(result).toEqual([]);
      expect(service.getCalendarList).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCalendarData', () => {
    it('should return all events when no calendar name specified', async () => {
      jest.spyOn(service, 'getCalendarEvents').mockResolvedValue(mockServiceResponse);

      const result = await controller.getCalendarData();

      expect(result).toEqual(mockServiceResponse);
      expect(service.getCalendarEvents).toHaveBeenCalledWith(undefined, undefined, undefined);
    });

    it('should return events for a specific calendar', async () => {
      jest.spyOn(service, 'getCalendarEvents').mockResolvedValue(mockServiceResponse);

      const result = await controller.getCalendarData('Alice');

      expect(result).toEqual(mockServiceResponse);
      expect(service.getCalendarEvents).toHaveBeenCalledWith('Alice', undefined, undefined);
    });

    it('should filter events by date range', async () => {
      const startDate = '2024-12-01T00:00:00Z';
      const endDate = '2024-12-31T23:59:59Z';
      jest.spyOn(service, 'getCalendarEvents').mockResolvedValue(mockServiceResponse);

      const result = await controller.getCalendarData(undefined, startDate, endDate);

      expect(result).toEqual(mockServiceResponse);
      expect(service.getCalendarEvents).toHaveBeenCalledWith(
        undefined,
        new Date(startDate),
        new Date(endDate)
      );
    });

    it('should handle all parameters together', async () => {
      const calendarName = 'Victoria';
      const startDate = '2024-12-01T00:00:00Z';
      const endDate = '2024-12-31T23:59:59Z';
      jest.spyOn(service, 'getCalendarEvents').mockResolvedValue(mockServiceResponse);

      const result = await controller.getCalendarData(calendarName, startDate, endDate);

      expect(result).toEqual(mockServiceResponse);
      expect(service.getCalendarEvents).toHaveBeenCalledWith(
        calendarName,
        new Date(startDate),
        new Date(endDate)
      );
    });

    it('should return empty events array when no matches found', async () => {
      const emptyResponse = { status: 200, events: [] };
      jest.spyOn(service, 'getCalendarEvents').mockResolvedValue(emptyResponse);

      const result = await controller.getCalendarData('NonExistent');

      expect(result.events).toEqual([]);
      expect(result.status).toBe(200);
    });

    it('should include calendarName in returned events', async () => {
      const calendarName = 'Work';
      jest.spyOn(service, 'getCalendarEvents').mockResolvedValue(mockServiceResponse);

      const result = await controller.getCalendarData(calendarName);

      expect(result.events.length).toBe(2);
      expect(result.events[0].calendarName).toBe('Alice');
      expect(result.events[1].calendarName).toBe('Bob');
    });

    it('should propagate errors from the service', async () => {
      const error = new Error('Calendar not found');
      jest.spyOn(service, 'getCalendarEvents').mockRejectedValue(error);

      await expect(controller.getCalendarData('Invalid')).rejects.toThrow('Calendar not found');
    });
  });
});

