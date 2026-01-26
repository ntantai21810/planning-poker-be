"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VotesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let VotesService = class VotesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async submitVote(storyId, submitVoteDto) {
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
    async getVotes(storyId) {
        return this.prisma.vote.findMany({
            where: { storyId },
            include: {
                participant: true,
            },
        });
    }
    async getVotesByRoom(roomId) {
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
    async resetVotes(storyId) {
        await this.prisma.vote.deleteMany({
            where: { storyId },
        });
        await this.prisma.story.update({
            where: { id: storyId },
            data: { status: 'voting', estimate: null },
        });
        return { success: true };
    }
    async calculateStatistics(storyId) {
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
        const numericVotes = votes
            .map((v) => parseFloat(v.value))
            .filter((v) => !isNaN(v));
        const distribution = {};
        votes.forEach((v) => {
            distribution[v.value] = (distribution[v.value] || 0) + 1;
        });
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
        let median;
        const mid = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) {
            median = (sorted[mid - 1] + sorted[mid]) / 2;
        }
        else {
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
    async revealVotes(storyId) {
        const votes = await this.getVotes(storyId);
        const statistics = await this.calculateStatistics(storyId);
        await this.prisma.story.update({
            where: { id: storyId },
            data: { status: 'completed' },
        });
        return {
            votes,
            statistics,
        };
    }
};
exports.VotesService = VotesService;
exports.VotesService = VotesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VotesService);
//# sourceMappingURL=votes.service.js.map