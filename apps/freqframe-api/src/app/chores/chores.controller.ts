import { Controller, Get, Logger, UseGuards } from '@nestjs/common';
import { ChoresService } from './chores.service';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { ChoreBoardState } from '@freqframe/shared-types';

@Controller('chores')
@UseGuards(ApiKeyGuard)
export class ChoresController {
    private readonly logger = new Logger(ChoresController.name);

    constructor(private readonly choresService: ChoresService) {}

    @Get('')
    async getBoard(): Promise<ChoreBoardState> {
        const state = await this.choresService.getBoardState();

        this.logger.log({
            endpoint: 'GET /chores',
            action: 'response',
            available: !('unavailable' in state),
            timestamp: new Date().toISOString(),
        });

        return state;
    }
}
