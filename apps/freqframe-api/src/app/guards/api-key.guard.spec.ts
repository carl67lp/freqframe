import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
    let guard: ApiKeyGuard;

    beforeEach(() => {
        guard = new ApiKeyGuard();
    });

    it('should allow request with valid API key', () => {
        const mockRequest = {
            headers: {
                'x-api-key': process.env.API_KEY || 'change-me-in-production',
            },
        };

        const mockContext = {
            switchToHttp: () => ({
                getRequest: () => mockRequest,
            }),
        } as ExecutionContext;

        expect(guard.canActivate(mockContext)).toBe(true);
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
