import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ChorePane } from './chore-pane';
import { ChoresService } from '../services/chores';
import { ChoreBoard, ChoreBoardState } from '@freqframe/shared-types';

const board = (overrides: Partial<ChoreBoard> = {}): ChoreBoard =>
  ({
    generated_at: '2026-07-24T21:00:00',
    month: {
      label: 'July 2026',
      earned: 12.5,
      goal: 40,
      status: 'behind',
      expected_by_now: 30.81,
      delta: -18.31,
      remaining: 27.5,
      pct_of_goal: 0.3125,
      fraction_elapsed: 0.77,
      day_of_month: 24,
      days_in_month: 31,
    },
    today: { date: '2026-07-24', earned: 1.75, counts: { fold_laundry: 1 } },
    week: {
      start: '2026-07-20',
      earned: 5,
      weekly_done: ['mow_lawn'],
      weekly_outstanding: [
        { id: 'empty_litter', name: 'Empty all litter boxes', price: 3 },
        { id: 'deep_bathroom', name: 'Deep clean one bathroom', price: 5 },
      ],
    },
    bonus: {
      price: 2,
      name: 'Employee of the Month',
      earned_this_week: false,
      daily_types_remaining: [],
      weekly_remaining: [],
      steps_remaining: 3,
    },
    jobs: {
      daily: [
        { id: 'fold_laundry', name: 'Fold laundry', price: 1 },
        { id: 'load_dishwasher', name: 'Load dishwasher', price: 0.75 },
        { id: 'clean_mirror', name: 'Clean bathroom mirror', price: 0.75 },
      ],
      weekly: [],
      bonus: { id: 'b', name: 'Bonus', price: 2 },
    },
    recent: [],
    last_activity: '2026-07-24T20:15:00',
    ...overrides,
  } as ChoreBoard);

const mount = async (state: ChoreBoardState): Promise<ComponentFixture<ChorePane>> => {
  await TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [ChorePane],
    providers: [
      {
        provide: ChoresService,
        useValue: { getBoardAutoRefresh: () => of(state) },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ChorePane);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
};

const text = (fixture: ComponentFixture<ChorePane>) =>
  (fixture.nativeElement as HTMLElement).textContent ?? '';

describe('ChorePane', () => {
  it('should create', async () => {
    const fixture = await mount(board());
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the month total and label', async () => {
    const fixture = await mount(board());

    expect(text(fixture)).toContain('$12.50');
    expect(text(fixture)).toContain('July 2026');
  });

  it('should render outstanding weekly jobs with their prices', async () => {
    const fixture = await mount(board());

    expect(text(fixture)).toContain('Empty all litter boxes');
    expect(text(fixture)).toContain('$3.00');
    expect(text(fixture)).toContain('Deep clean one bathroom');
  });

  it('should say so when all weekly jobs are done', async () => {
    const fixture = await mount(
      board({
        week: {
          start: '2026-07-20',
          earned: 20,
          weekly_done: ['mow_lawn'],
          weekly_outstanding: [],
        },
      })
    );

    expect(text(fixture)).toContain('All weekly jobs done');
  });

  it('should list every daily chore as an available quick-hit', async () => {
    const fixture = await mount(board());

    const rendered = text(fixture);
    // Dailies pay out repeatedly, so all of them stay on the board regardless
    // of what has already been logged today.
    expect(rendered).toContain('Fold laundry');
    expect(rendered).toContain('Load dishwasher');
    expect(rendered).toContain('Clean bathroom mirror');
    expect(rendered).toContain('$0.75');
  });

  it('should keep a daily chore listed after it has been done today', async () => {
    const fixture = await mount(
      board({
        today: { date: '2026-07-24', earned: 2, counts: { fold_laundry: 2 } },
      })
    );

    const items = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.c9-dailies li'
    );
    expect(items.length).toBe(3);
    expect(text(fixture)).toContain('Fold laundry');
  });

  it("should show how many times a daily was logged today", async () => {
    const fixture = await mount(
      board({
        today: { date: '2026-07-24', earned: 2, counts: { fold_laundry: 2 } },
      })
    );

    const done = (fixture.nativeElement as HTMLElement).querySelector(
      '.c9-dailies li.done-today'
    );
    expect(done).toBeTruthy();
    expect(done?.textContent).toContain('Fold laundry');
    expect(done?.textContent).toContain('2×');
  });

  it('should not show a count for a daily not yet done today', async () => {
    const fixture = await mount(
      board({ today: { date: '2026-07-24', earned: 0, counts: {} } })
    );

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.c9-dailies li').length).toBe(3);
    // A bare "0×" next to every untouched job would be noise.
    expect(compiled.querySelectorAll('.c9-dailies li.done-today').length).toBe(0);
    expect(compiled.querySelectorAll('.c9-count').length).toBe(0);
  });

  it('should mark the dailies still needed for the weekly bonus', async () => {
    const fixture = await mount(
      board({
        bonus: {
          ...board().bonus,
          daily_types_remaining: [
            { id: 'clean_mirror', name: 'Clean bathroom mirror', price: 0.75 },
          ],
        },
      })
    );

    const flagged = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.c9-dailies li.bonus-job'
    );
    expect(flagged.length).toBe(1);
    expect(flagged[0].textContent).toContain('Clean bathroom mirror');
    expect(text(fixture)).toContain("still needed for this week's bonus");
  });

  it('should drop the bonus markers once the bonus is earned', async () => {
    const fixture = await mount(
      board({
        bonus: {
          ...board().bonus,
          earned_this_week: true,
          daily_types_remaining: [
            { id: 'clean_mirror', name: 'Clean bathroom mirror', price: 0.75 },
          ],
        },
      })
    );

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.c9-dailies li.bonus-job').length).toBe(0);
    expect(text(fixture)).not.toContain("still needed for this week's bonus");
  });

  it('should show the unavailable state without inventing figures', async () => {
    const fixture = await mount({ unavailable: true, reason: 'unreachable' });

    const rendered = text(fixture);
    expect(rendered).toContain('Task board unavailable');
    // A fabricated $0.00 would read as a real month with nothing earned.
    expect(rendered).not.toContain('$0.00');
  });

  it('should flag a stale board that is being served from cache', async () => {
    const fixture = await mount({ ...board(), stale: true } as ChoreBoardState);

    expect(text(fixture)).toContain('board offline');
  });

  it('should not flag a fresh board as stale', async () => {
    const fixture = await mount(board());

    expect(text(fixture)).not.toContain('board offline');
  });

  describe('paceHeadline', () => {
    let component: ChorePane;

    beforeEach(async () => {
      component = (await mount(board())).componentInstance;
    });

    it('should report a shortfall when behind', () => {
      expect(component.paceHeadline(board().month)).toBe('$18.31 behind pace');
    });

    it('should report a surplus when ahead', () => {
      const month = { ...board().month, status: 'ahead' as const, delta: 6.25 };
      expect(component.paceHeadline(month)).toBe('$6.25 ahead of pace');
    });

    it('should say on pace when on track', () => {
      const month = { ...board().month, status: 'on_track' as const, delta: 0.5 };
      expect(component.paceHeadline(month)).toBe('Right on pace');
    });

    it('should not mention pace when no goal is configured', () => {
      const month = {
        ...board().month,
        status: 'no_goal' as const,
        goal: null,
        delta: null,
      };
      expect(component.paceHeadline(month)).toBe('Keep it up');
    });
  });

  describe('progress bar geometry', () => {
    let component: ChorePane;

    beforeEach(async () => {
      component = (await mount(board())).componentInstance;
    });

    it('should size the fill from the percentage of goal', () => {
      expect(component.fillPercent(board().month)).toBe(31);
    });

    it('should treat a missing percentage as empty', () => {
      const month = { ...board().month, pct_of_goal: null };
      expect(component.fillPercent(month)).toBe(0);
    });

    it('should place the marker at the elapsed fraction of the month', () => {
      expect(component.markerPercent(board().month)).toBe(77);
    });
  });

  describe('countToday', () => {
    let component: ChorePane;

    beforeEach(async () => {
      component = (await mount(board())).componentInstance;
    });

    it('should return the logged count', () => {
      const withCounts = board({
        today: { date: '2026-07-24', earned: 3, counts: { fold_laundry: 3 } },
      });
      expect(component.countToday(withCounts, 'fold_laundry')).toBe(3);
    });

    it('should return zero for a job with no entry today', () => {
      expect(component.countToday(board(), 'clean_mirror')).toBe(0);
    });
  });

  describe('countsTowardBonus', () => {
    let component: ChorePane;

    beforeEach(async () => {
      component = (await mount(board())).componentInstance;
    });

    it('should be true while the job is still outstanding for the week', () => {
      const b = board({
        bonus: {
          ...board().bonus,
          daily_types_remaining: [
            { id: 'clean_mirror', name: 'Clean bathroom mirror', price: 0.75 },
          ],
        },
      });
      expect(component.countsTowardBonus(b, 'clean_mirror')).toBe(true);
      expect(component.countsTowardBonus(b, 'fold_laundry')).toBe(false);
    });

    it('should be false for every job once the bonus is banked', () => {
      const b = board({
        bonus: {
          ...board().bonus,
          earned_this_week: true,
          daily_types_remaining: [
            { id: 'clean_mirror', name: 'Clean bathroom mirror', price: 0.75 },
          ],
        },
      });
      expect(component.countsTowardBonus(b, 'clean_mirror')).toBe(false);
    });
  });

  describe('bonusCaption', () => {
    let component: ChorePane;

    beforeEach(async () => {
      component = (await mount(board())).componentInstance;
    });

    it('should count down remaining jobs', () => {
      expect(component.bonusCaption(board().bonus)).toBe('3 jobs to go this week');
    });

    it('should use the singular for the last job', () => {
      const bonus = { ...board().bonus, steps_remaining: 1 };
      expect(component.bonusCaption(bonus)).toBe('1 job to go this week');
    });

    it('should celebrate once earned', () => {
      const bonus = { ...board().bonus, earned_this_week: true };
      expect(component.bonusCaption(bonus)).toBe('Earned this week — $2.00');
    });
  });

  describe('lastActivityLabel', () => {
    let component: ChorePane;

    beforeEach(async () => {
      component = (await mount(board())).componentInstance;
    });

    it('should handle a board with no history', () => {
      expect(component.lastActivityLabel(null)).toBe('Nothing logged yet');
    });

    it('should handle an unparseable timestamp', () => {
      expect(component.lastActivityLabel('not-a-date')).toBe('Nothing logged yet');
    });

    it.each([
      [30 * 1000, 'Just now'],
      [15 * 60 * 1000, '15m ago'],
      [3 * 60 * 60 * 1000, '3h ago'],
      [26 * 60 * 60 * 1000, 'Yesterday'],
      [5 * 24 * 60 * 60 * 1000, '5 days ago'],
    ])('should describe %ims ago as "%s"', (agoMs, expected) => {
      const when = new Date(Date.now() - (agoMs as number)).toISOString();
      expect(component.lastActivityLabel(when)).toBe(expected);
    });
  });
});
