import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChoresService } from './chores.service';
import { ChoreBoard, isChoreBoardUnavailable } from '@freqframe/shared-types';

const BASE_URL = 'http://cloud9.test:5000';

const boardFixture = (earned = 12.5) =>
    ({
        generated_at: '2026-07-24T21:00:00',
        month: {
            label: 'July 2026',
            earned,
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
            earned: 5.0,
            weekly_done: ['mow_lawn'],
            weekly_outstanding: [{ id: 'empty_litter', name: 'Empty all litter boxes', price: 3 }],
        },
        bonus: {
            price: 2,
            name: 'Employee of the Month',
            earned_this_week: false,
            daily_types_remaining: [],
            weekly_remaining: [],
            steps_remaining: 3,
        },
        jobs: { daily: [], weekly: [], bonus: { id: 'b', name: 'Bonus', price: 2 } },
        recent: [],
        last_activity: '2026-07-24T20:15:00',
    } as ChoreBoard);

const buildService = async (baseUrl: string | undefined) => {
    const module: TestingModule = await Test.createTestingModule({
        providers: [
            ChoresService,
            {
                provide: ConfigService,
                useValue: {
                    get: jest.fn((key: string) =>
                        key === 'CLOUD9_BASE_URL' ? baseUrl : undefined
                    ),
                },
            },
        ],
    }).compile();

    return module.get<ChoresService>(ChoresService);
};

const mockFetchOnce = (body: unknown, ok = true, status = 200) =>
    jest.spyOn(global, 'fetch' as never).mockResolvedValueOnce({
        ok,
        status,
        json: jest.fn().mockResolvedValue(body),
    } as never);

describe('ChoresService', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    it('should return the upstream board state', async () => {
        const service = await buildService(BASE_URL);
        mockFetchOnce(boardFixture());

        const state = await service.getBoardState();

        expect(isChoreBoardUnavailable(state)).toBe(false);
        expect((state as ChoreBoard).month.earned).toBe(12.5);
    });

    it('should request /api/state on the configured base URL', async () => {
        const service = await buildService(BASE_URL);
        const fetchSpy = mockFetchOnce(boardFixture());

        await service.getBoardState();

        expect(fetchSpy).toHaveBeenCalledWith(
            `${BASE_URL}/api/state`,
            expect.anything()
        );
    });

    it('should tolerate a trailing slash on the base URL', async () => {
        const service = await buildService(`${BASE_URL}/`);
        const fetchSpy = mockFetchOnce(boardFixture());

        await service.getBoardState();

        expect(fetchSpy).toHaveBeenCalledWith(
            `${BASE_URL}/api/state`,
            expect.anything()
        );
    });

    it('should serve a cached response rather than refetching', async () => {
        const service = await buildService(BASE_URL);
        const fetchSpy = mockFetchOnce(boardFixture());

        await service.getBoardState();
        const second = await service.getBoardState();

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect((second as ChoreBoard).month.earned).toBe(12.5);
    });

    it('should refetch once the cache has expired', async () => {
        jest.useFakeTimers();
        const service = await buildService(BASE_URL);
        mockFetchOnce(boardFixture(12.5));

        await service.getBoardState();
        jest.advanceTimersByTime(31_000);
        mockFetchOnce(boardFixture(20));
        const refreshed = await service.getBoardState();

        expect((refreshed as ChoreBoard).month.earned).toBe(20);
    });

    it('should report unavailable when the board cannot be reached', async () => {
        const service = await buildService(BASE_URL);
        jest.spyOn(global, 'fetch' as never).mockRejectedValueOnce(
            new Error('ECONNREFUSED') as never
        );

        const state = await service.getBoardState();

        // Emitting a zeroed board here would render as a real $0.00 month.
        expect(isChoreBoardUnavailable(state)).toBe(true);
        expect(state).toEqual({ unavailable: true, reason: 'unreachable' });
    });

    it('should treat a non-2xx upstream response as unavailable', async () => {
        const service = await buildService(BASE_URL);
        mockFetchOnce({}, false, 502);

        const state = await service.getBoardState();

        expect(isChoreBoardUnavailable(state)).toBe(true);
    });

    it('should report unavailable when no base URL is configured', async () => {
        const service = await buildService(undefined);
        const fetchSpy = jest.spyOn(global, 'fetch' as never);

        const state = await service.getBoardState();

        expect(state).toEqual({ unavailable: true, reason: 'not_configured' });
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should fall back to the last good response, flagged stale', async () => {
        jest.useFakeTimers();
        const service = await buildService(BASE_URL);
        mockFetchOnce(boardFixture(12.5));
        await service.getBoardState();

        jest.advanceTimersByTime(31_000);
        jest.spyOn(global, 'fetch' as never).mockRejectedValueOnce(
            new Error('ECONNREFUSED') as never
        );
        const state = await service.getBoardState();

        expect(isChoreBoardUnavailable(state)).toBe(false);
        expect((state as ChoreBoard & { stale: true }).stale).toBe(true);
        expect((state as ChoreBoard).month.earned).toBe(12.5);
    });
});
