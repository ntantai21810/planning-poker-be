import {
    Controller,
    Get,
    Post,
    Body,
    Param,
} from '@nestjs/common';
import { VotesService } from './votes.service';
import { SubmitVoteDto } from './dto/vote.dto';

@Controller('api/stories')
export class VotesController {
    constructor(private readonly votesService: VotesService) { }

    @Post(':id/vote')
    async submitVote(
        @Param('id') storyId: string,
        @Body() submitVoteDto: SubmitVoteDto,
    ) {
        return this.votesService.submitVote(storyId, submitVoteDto);
    }

    @Get(':id/votes')
    async getVotes(@Param('id') storyId: string) {
        return this.votesService.getVotes(storyId);
    }

    @Post(':id/reveal')
    async revealVotes(@Param('id') storyId: string) {
        return this.votesService.revealVotes(storyId);
    }

    @Post(':id/reset')
    async resetVotes(@Param('id') storyId: string) {
        return this.votesService.resetVotes(storyId);
    }

    @Get(':id/statistics')
    async getStatistics(@Param('id') storyId: string) {
        return this.votesService.calculateStatistics(storyId);
    }
}
