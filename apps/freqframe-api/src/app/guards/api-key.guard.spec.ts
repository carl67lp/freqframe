import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';

const TEST_API_KEY = 'test-api-key';

const contextWithHeaders = (headers: Record<string, string>) =>
    ({
        switchToHttp: () => ({
            getRequest: () => ({ headers }),
        }),
    } as ExecutionContext);

describe('ApiKeyGuard', () => {
    let guard: ApiKeyGuard;
    const originalApiKey = process.env.API_KEY;

    beforeEach(() => {
        process.env.API_KEY = TEST_API_KEY;
        guard = new ApiKeyGuard();
    });

    afterEach(() => {
        process.env.API_KEY = originalApiKey;
    });

    it('should allow request with valid API key', () => {
        const mockRequest = {
            headers: {
                'x-api-key': TEST_API_KEY,
            },
        };

        const mockContext = {
            switchToHttp: () => ({
                getRequest: () => mockRequest,
            }),
        } as ExecutionContext;

        expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('should reject every request when API_KEY is not configured', () => {
        delete process.env.API_KEY;
        const unconfiguredGuard = new ApiKeyGuard();

        expect(() =>
            unconfiguredGuard.canActivate(
                contextWithHeaders({ 'x-api-key': TEST_API_KEY })
            )
        ).toThrow(UnauthorizedException);
        expect(() =>
            unconfiguredGuard.canActivate(
                contextWithHeaders({ 'x-api-key': 'change-me-in-production' })
            )
        ).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with missing API key', () => {
        const mockRequest = {
            headers: {},
        };

        const mockContext = {
            switchToHttp: () => ({
                getRequest: () => mockRequest,
            }),
        } as ExecutionContext;

        expect(() => guard.canActivate(mockContext)).toThrow(
            UnauthorizedException
        );
    });

    it('should throw UnauthorizedException with invalid API key', () => {
        const mockRequest = {
            headers: {
                'x-api-key': 'wrong-key',
            },
        };

        const mockContext = {
            switchToHttp: () => ({
                getRequest: () => mockRequest,
            }),
        } as ExecutionContext;

        expect(() => guard.canActivate(mockContext)).toThrow(
            UnauthorizedException
        );
    });
});
