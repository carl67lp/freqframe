import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarPane } from './calendar-pane';
import { CalendarService } from '../services/calendar';
import { CalendarEvent } from '@freqframe/shared-types';

describe('CalendarPane', () => {
  let component: CalendarPane;
  let fixture: ComponentFixture<CalendarPane>;
  let mockCalendarService: Partial<CalendarService>;

  beforeEach(async () => {
    mockCalendarService = {
      getEvents: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CalendarPane],
      providers: [{ provide: CalendarService, useValue: mockCalendarService }],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarPane);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getDateLabel', () => {
    let today: Date;

    beforeEach(() => {
      today = new Date(2025, 11, 20); // Dec 20, 2025
      today.setHours(0, 0, 0, 0);
    });

    it('should label today as "Today"', () => {
      const eventDate = new Date(2025, 11, 20); // Dec 20, 2025
      eventDate.setHours(0, 0, 0, 0);
      
      const result = (component as any).getDateLabel(eventDate, today);
      
      expect(result.label).toBe('Today');
      expect(result.sortKey).toBe('0-today');
    });

    it('should label tomorrow as "Tomorrow"', () => {
      const eventDate = new Date(2025, 11, 21); // Dec 21, 2025
      eventDate.setHours(0, 0, 0, 0);
      
      const result = (component as any).getDateLabel(eventDate, today);
      
      expect(result.label).toBe('Tomorrow');
      expect(result.sortKey).toBe('1-tomorrow');
    });

    it('should label days within one week as day name', () => {
      const eventDate = new Date(2025, 11, 22); // Monday Dec 22
      eventDate.setHours(0, 0, 0, 0);
      
      const result = (component as any).getDateLabel(eventDate, today);
      
      expect(result.label).toBe('Monday');
      expect(result.sortKey).toContain('2-02');
    });

    it('should label dates beyond one week as full date', () => {
      const eventDate = new Date(2025, 11, 28); // 8 days out
      eventDate.setHours(0, 0, 0, 0);
      
      const result = (component as any).getDateLabel(eventDate, today);
      
      expect(result.label).toMatch(/Dec.*28.*2025/);
      expect(result.sortKey).toBe('2025-12-28');
    });
  });

  describe('groupEventsByDate', () => {
    let today: Date;

    beforeEach(() => {
      today = new Date(2025, 11, 20); // Dec 20, 2025
      today.setHours(0, 0, 0, 0);
      (component as any).currentDate = today;
    });

    it('should group events by date', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Today Event',
          start: '2025-12-20T10:00:00Z',
          end: '2025-12-20T11:00:00Z',
          allDay: false,
        },
        {
          id: '2',
          title: 'Tomorrow Event',
          start: '2025-12-21T14:00:00Z',
          end: '2025-12-21T15:00:00Z',
          allDay: false,
        },
      ];

      const grouped = (component as any).groupEventsByDate(events);

      expect(grouped.length).toBe(2);
      expect(grouped[0].dateLabel).toBe('Today');
      expect(grouped[0].events.length).toBe(1);
      expect(grouped[1].dateLabel).toBe('Tomorrow');
      expect(grouped[1].events.length).toBe(1);
    });

    it('should sort groups in chronological order', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Event 1',
          start: '2026-01-17T10:00:00Z',
          end: '2026-01-17T11:00:00Z',
          allDay: false,
        },
        {
          id: '2',
          title: 'Event 2',
          start: '2025-12-28T14:00:00Z',
          end: '2025-12-28T15:00:00Z',
          allDay: false,
        },
        {
          id: '3',
          title: 'Event 3',
          start: '2026-01-05T14:00:00Z',
          end: '2026-01-05T15:00:00Z',
          allDay: false,
        },
      ];

      const grouped = (component as any).groupEventsByDate(events);

      // Should be sorted: Dec 28, then Jan 5, then Jan 17
      expect(grouped[0].dateLabel).toMatch(/Dec.*28.*2025/);
      expect(grouped[1].dateLabel).toMatch(/Jan.*5.*2026/);
      expect(grouped[2].dateLabel).toMatch(/Jan.*17.*2026/);
    });

    it('should handle multiple events on same day', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Event 1',
          start: '2025-12-20T10:00:00Z',
          end: '2025-12-20T11:00:00Z',
          allDay: false,
        },
        {
          id: '2',
          title: 'Event 2',
          start: '2025-12-20T14:00:00Z',
          end: '2025-12-20T15:00:00Z',
          allDay: false,
        },
      ];

      const grouped = (component as any).groupEventsByDate(events);

      expect(grouped.length).toBe(1);
      expect(grouped[0].dateLabel).toBe('Today');
      expect(grouped[0].events.length).toBe(2);
    });

    it('should handle empty event list', () => {
      const grouped = (component as any).groupEventsByDate([]);

      expect(grouped.length).toBe(0);
    });

    it('should correctly sort relative dates before full dates', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Today',
          start: '2025-12-20T10:00:00Z',
          end: '2025-12-20T11:00:00Z',
          allDay: false,
        },
        {
          id: '2',
          title: 'Jan 17',
          start: '2026-01-17T10:00:00Z',
          end: '2026-01-17T11:00:00Z',
          allDay: false,
        },
        {
          id: '3',
          title: 'Tomorrow',
          start: '2025-12-21T10:00:00Z',
          end: '2025-12-21T11:00:00Z',
          allDay: false,
        },
        {
          id: '4',
          title: 'Monday',
          start: '2025-12-22T10:00:00Z',
          end: '2025-12-22T11:00:00Z',
          allDay: false,
        },
      ];

      const grouped = (component as any).groupEventsByDate(events);

      // Should be: Today, Tomorrow, Monday, then Jan 17
      expect(grouped[0].dateLabel).toBe('Today');
      expect(grouped[1].dateLabel).toBe('Tomorrow');
      expect(grouped[2].dateLabel).toBe('Monday');
      expect(grouped[3].dateLabel).toMatch(/Jan.*17.*2026/);
    });
  });
});
