import { PrismaService } from '../prisma/prisma.service';
import { SubmitVoteDto } from './dto/vote.dto';
export declare class VotesService {
    private prisma;
    constructor(prisma: PrismaService);
    submitVote(storyId: string, submitVoteDto: SubmitVoteDto): Promise<{
        participant: {
            name: string;
            role: string;
            id: string;
            joinedAt: Date;
            roomId: string;
            isOnline: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        storyId: string;
        participantId: string;
        value: string;
    }>;
    getVotes(storyId: string): Promise<({
        participant: {
            name: string;
            role: string;
            id: string;
            joinedAt: Date;
            roomId: string;
            isOnline: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        storyId: string;
        participantId: string;
        value: string;
    })[]>;
    getVotesByRoom(roomId: string): Promise<({
        story: {
            id: string;
            createdAt: Date;
            order: number;
            roomId: string;
            title: string;
            description: string | null;
            estimate: string | null;
            status: string;
        };
        participant: {
            name: string;
            role: string;
            id: string;
            joinedAt: Date;
            roomId: string;
            isOnline: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        storyId: string;
        participantId: string;
        value: string;
    })[]>;
    resetVotes(storyId: string): Promise<{
        success: boolean;
    }>;
    calculateStatistics(storyId: string): Promise<{
        count: number;
        average: null;
        median: null;
        min: null;
        max: null;
        distribution: Record<string, number>;
        consensus: boolean;
    } | {
        count: number;
        average: number;
        median: number;
        min: number;
        max: number;
        distribution: Record<string, number>;
        consensus: boolean;
    }>;
    revealVotes(storyId: string): Promise<{
        votes: ({
            participant: {
                name: string;
                role: string;
                id: string;
                joinedAt: Date;
                roomId: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            storyId: string;
            participantId: string;
            value: string;
        })[];
        statistics: {
            count: number;
            average: null;
            median: null;
            min: null;
            max: null;
            distribution: Record<string, number>;
            consensus: boolean;
        } | {
            count: number;
            average: number;
            median: number;
            min: number;
            max: number;
            distribution: Record<string, number>;
            consensus: boolean;
        };
    }>;
}
