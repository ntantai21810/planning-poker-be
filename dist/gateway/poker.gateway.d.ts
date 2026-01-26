import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
interface JoinRoomPayload {
    roomId: string;
    participantId: string;
    name: string;
}
interface VotePayload {
    roomId: string;
    storyId: string;
    participantId: string;
    value: string;
}
interface StoryPayload {
    roomId: string;
    storyId?: string;
    title?: string;
    description?: string;
    order?: number;
    status?: string;
    estimate?: string;
}
interface MessagePayload {
    roomId: string;
    participantId: string;
    participantName: string;
    message: string;
}
export declare class PokerGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private prisma;
    server: Server;
    private socketToParticipant;
    constructor(prisma: PrismaService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    handleJoinRoom(client: Socket, payload: JoinRoomPayload): Promise<{
        success: boolean;
    }>;
    handleLeaveRoom(client: Socket, payload: {
        roomId: string;
        participantId: string;
    }): Promise<{
        success: boolean;
    }>;
    handleSubmitVote(client: Socket, payload: VotePayload): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    handleRevealVotes(client: Socket, payload: {
        roomId: string;
        storyId: string;
    }): Promise<{
        success: boolean;
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
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        votes?: undefined;
        statistics?: undefined;
    }>;
    handleResetVoting(client: Socket, payload: {
        roomId: string;
        storyId: string;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    handleAddStory(client: Socket, payload: StoryPayload): Promise<{
        success: boolean;
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
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        story?: undefined;
    }>;
    handleUpdateStory(client: Socket, payload: StoryPayload): Promise<{
        success: boolean;
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
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        story?: undefined;
    }>;
    handleDeleteStory(client: Socket, payload: {
        roomId: string;
        storyId: string;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    handleStartVoting(client: Socket, payload: {
        roomId: string;
        storyId: string;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    handleSetEstimate(client: Socket, payload: {
        roomId: string;
        storyId: string;
        estimate: string;
    }): Promise<{
        success: boolean;
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
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        story?: undefined;
    }>;
    handleSendMessage(client: Socket, payload: MessagePayload): Promise<{
        success: boolean;
    }>;
    private emitRoomState;
    private calculateStatistics;
}
export {};
