import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitVoteDto } from './dto/vote.dto';

@Injectable()
export class VotesService {
    constructor(private prisma: PrismaService) { }

    async submitVote(storyId: string, submitVoteDto: SubmitVoteDto) {
        // Upsert vote - either create new or update existing
        const vote = await this.prisma.vote.upsert({
            where: {
                storyId_participantId: {
                    storyId,
                    participantId: submitVoteDto.participantId,
                },
            },
            update: {
                value: submitVoteDto.value,
            },
            create: {
                storyId,
                participantId: submitVoteDto.participantId,
                value: submitVoteDto.value,
            },
            include: {
                participant: true,
            },
        });

        return vote;
    }

    async getVotes(storyId: string) {
        return this.prisma.vote.findMany({
            where: { storyId },
            include: {
                participant: true,
            },
        });
    }

    async getVotesByRoom(roomId: string) {
        return this.prisma.vote.findMany({
            where: {
                story: { roomId },
            },
            include: {
                participant: true,
                story: true,
            },
        });
    }

    async resetVotes(storyId: string) {
        await this.prisma.vote.deleteMany({
            where: { storyId },
        });

        // Set story status back to voting
        await this.prisma.story.update({
            where: { id: storyId },
            data: { status: 'voting', estimate: null },
        });

        return { success: true };
    }

    async calculateStatistics(storyId: string) {
        const votes = await this.getVotes(storyId);

        if (votes.length === 0) {
            return {
                count: 0,
                average: null,
                median: null,
                min: null,
                max: null,
                distribution: {},
                consensus: false,
            };
        }

        // Filter numeric votes for calculations
        const numericVotes = votes
            .map((v) => parseFloat(v.value))
            .filter((v) => !isNaN(v));

        const distribution: Record<string, number> = {};
        votes.forEach((v) => {
            distribution[v.value] = (distribution[v.value] || 0) + 1;
        });

        // Check consensus (all votes are the same)
        const uniqueValues = new Set(votes.map((v) => v.value));
        const consensus = uniqueValues.size === 1;

        if (numericVotes.length === 0) {
            return {
                count: votes.length,
                average: null,
                median: null,
                min: null,
                max: null,
                distribution,
                consensus,
            };
        }

        const sorted = [...numericVotes].sort((a, b) => a - b);
        const sum = numericVotes.reduce((a, b) => a + b, 0);
        const average = sum / numericVotes.length;

        let median: number;
        const mid = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) {
            median = (sorted[mid - 1] + sorted[mid]) / 2;
        } else {
            median = sorted[mid];
        }

        return {
            count: votes.length,
            average: Math.round(average * 100) / 100,
            median,
            min: Math.min(...numericVotes),
            max: Math.max(...numericVotes),
            distribution,
            consensus,
        };
    }

    async revealVotes(storyId: string) {
        const votes = await this.getVotes(storyId);
        const statistics = await this.calculateStatistics(storyId);

        // Update story status
        await this.prisma.story.update({
            where: { id: storyId },
            data: { status: 'completed' },
        });

        return {
            votes,
            statistics,
        };
    }
}
