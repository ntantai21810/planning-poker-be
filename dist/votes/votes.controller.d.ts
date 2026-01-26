import { VotesService } from './votes.service';
import { SubmitVoteDto } from './dto/vote.dto';
export declare class VotesController {
    private readonly votesService;
    constructor(votesService: VotesService);
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
    resetVotes(storyId: string): Promise<{
        success: boolean;
    }>;
    getStatistics(storyId: string): Promise<{
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
}
