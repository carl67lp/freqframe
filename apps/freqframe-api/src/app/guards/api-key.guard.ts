import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    // No default: falling back to a well-known literal meant that forgetting to
    // set API_KEY left the API open to anyone who had read the source.
    private readonly API_KEY = process.env.API_KEY;

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const apiKey = request.headers['x-api-key'];

        if (!this.API_KEY) {
            throw new UnauthorizedException('API key is not configured');
        }

        if (!apiKey || apiKey !== this.API_KEY) {
            throw new UnauthorizedException('Invalid or missing API key');
        }

        return true;
    }
}
