import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChoreBoardState } from '@freqframe/shared-types';

/**
 * How long an upstream response is reused. The wall display polls continuously
 * but the board only changes a handful of times a day, so this keeps the Cloud 9
 * container idle without making the dashboard feel stale.
 */
const CACHE_TTL_MS = 30_000;

const REQUEST_TIMEOUT_MS = 5_000;

@Injectable()
export class ChoresService {
    private readonly logger = new Logger(ChoresService.name);
    private readonly baseUrl: string;

    private cached?: { at: number; state: ChoreBoardState };

    constructor(private readonly configService: ConfigService) {
        this.baseUrl = (
            this.configService.get<string>('CLOUD9_BASE_URL') ?? ''
        ).replace(/\/+$/, '');
    }

    async getBoardState(): Promise<ChoreBoardState> {
        const now = Date.now();
        if (this.cached && now - this.cached.at < CACHE_TTL_MS) {
            return this.cached.state;
        }

        if (!this.baseUrl) {
            this.logger.warn({
                action: 'chores_not_configured',
                detail: 'CLOUD9_BASE_URL is unset',
            });
            return { unavailable: true, reason: 'not_configured' };
        }

        try {
            const state = await this.fetchState();
            this.cached = { at: now, state };
            return state;
        } catch (error) {
            this.logger.error({
                action: 'chores_fetch_failed',
                url: `${this.baseUrl}/api/state`,
                error: `${error}`,
            });
            // Serve the last good response rather than a hole in the dashboard,
            // but never invent numbers when there is nothing to fall back to.
            if (this.cached) {
                return { ...this.cached.state, stale: true };
            }
            return { unavailable: true, reason: 'unreachable' };
        }
    }

    private async fetchState(): Promise<ChoreBoardState> {
        const response = await fetch(`${this.baseUrl}/api/state`, {
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        if (!response.ok) {
            throw new Error(`upstream responded ${response.status}`);
        }

        return (await response.json()) as ChoreBoardState;
    }
}
