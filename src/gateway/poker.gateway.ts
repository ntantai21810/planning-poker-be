import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
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

@WebSocketGateway({
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    },
})
export class PokerGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // Map socket ID to participant info
    private socketToParticipant: Map<
        string,
        { roomId: string; participantId: string }
    > = new Map();

    constructor(private prisma: PrismaService) { }

    async handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    async handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);

        const participantInfo = this.socketToParticipant.get(client.id);
        if (participantInfo) {
            const { roomId, participantId } = participantInfo;

            // Update participant as offline
            try {
                await this.prisma.participant.update({
                    where: { id: participantId },
                    data: { isOnline: false },
                });

                // Notify room
                this.server.to(roomId).emit('user-left', {
                    participantId,
                    timestamp: new Date().toISOString(),
                });

                // Send updated room state
                await this.emitRoomState(roomId);
            } catch (error) {
                console.error('Error handling disconnect:', error);
            }

            this.socketToParticipant.delete(client.id);
        }
    }

    @SubscribeMessage('join-room')
    async handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: JoinRoomPayload,
    ) {
        const { roomId, participantId, name } = payload;

        // Join socket room
        client.join(roomId);

        // Store mapping
        this.socketToParticipant.set(client.id, { roomId, participantId });

        // Update participant as online
        try {
            await this.prisma.participant.update({
                where: { id: participantId },
                data: { isOnline: true },
            });
        } catch (error) {
            console.error('Error updating participant online status:', error);
        }

        // Notify others in room
        client.to(roomId).emit('user-joined', {
            participantId,
            name,
            timestamp: new Date().toISOString(),
        });

        // Send current room state to the joining user
        await this.emitRoomState(roomId, client);

        return { success: true };
    }

    @SubscribeMessage('leave-room')
    async handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { roomId: string; participantId: string },
    ) {
        const { roomId, participantId } = payload;

        client.leave(roomId);
        this.socketToParticipant.delete(client.id);

        try {
            await this.prisma.participant.update({
                where: { id: participantId },
                data: { isOnline: false },
            });
        } catch (error) {
            console.error('Error updating participant offline status:', error);
        }

        this.server.to(roomId).emit('user-left', {
            participantId,
            timestamp: new Date().toISOString(),
        });

        await this.emitRoomState(roomId);

        return { success: true };
    }

    @SubscribeMessage('submit-vote')
    async handleSubmitVote(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: VotePayload,
    ) {
        const { roomId, storyId, participantId, value } = payload;

        try {
            // Upsert vote
            await this.prisma.vote.upsert({
                where: {
                    storyId_participantId: {
                        storyId,
                        participantId,
                    },
                },
                update: { value },
                create: {
                    storyId,
                    participantId,
                    value,
                },
            });

            // Notify room that someone voted (without revealing value)
            this.server.to(roomId).emit('vote-submitted', {
                storyId,
                participantId,
                timestamp: new Date().toISOString(),
            });

            // Check if all online voters have voted
            const room = await this.prisma.room.findUnique({
                where: { id: roomId },
                include: {
                    participants: {
                        where: { isOnline: true, role: { not: 'observer' } },
                    },
                },
            });

            const votes = await this.prisma.vote.findMany({
                where: { storyId },
            });

            const allVoted =
                room &&
                room.participants.length > 0 &&
                room.participants.every((p) =>
                    votes.some((v) => v.participantId === p.id),
                );

            if (allVoted && room?.autoReveal) {
                // Auto-reveal votes
                await this.handleRevealVotes(client, { roomId, storyId });
            }

            return { success: true };
        } catch (error) {
            console.error('Error submitting vote:', error);
            return { success: false, error: 'Failed to submit vote' };
        }
    }

    @SubscribeMessage('reveal-votes')
    async handleRevealVotes(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { roomId: string; storyId: string },
    ) {
        const { roomId, storyId } = payload;

        try {
            const votes = await this.prisma.vote.findMany({
                where: { storyId },
                include: { participant: true },
            });

            // Calculate statistics
            const statistics = this.calculateStatistics(votes);

            // Update story status
            await this.prisma.story.update({
                where: { id: storyId },
                data: { status: 'completed' },
            });

            // Emit revealed votes to all in room
            this.server.to(roomId).emit('votes-revealed', {
                storyId,
                votes: votes.map((v) => ({
                    participantId: v.participantId,
                    participantName: v.participant.name,
                    value: v.value,
                })),
                statistics,
                timestamp: new Date().toISOString(),
            });

            return { success: true, votes, statistics };
        } catch (error) {
            console.error('Error revealing votes:', error);
            return { success: false, error: 'Failed to reveal votes' };
        }
    }

    @SubscribeMessage('reset-voting')
    async handleResetVoting(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { roomId: string; storyId: string },
    ) {
        const { roomId, storyId } = payload;

        try {
            // Delete all votes for this story
            await this.prisma.vote.deleteMany({
                where: { storyId },
            });

            // Reset story status
            await this.prisma.story.update({
                where: { id: storyId },
                data: { status: 'voting', estimate: null },
            });

            // Notify room
            this.server.to(roomId).emit('voting-reset', {
                storyId,
                timestamp: new Date().toISOString(),
            });

            return { success: true };
        } catch (error) {
            console.error('Error resetting voting:', error);
            return { success: false, error: 'Failed to reset voting' };
        }
    }

    @SubscribeMessage('add-story')
    async handleAddStory(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: StoryPayload,
    ) {
        const { roomId, title, description } = payload;

        try {
            // Get max order
            const maxOrderStory = await this.prisma.story.findFirst({
                where: { roomId },
                orderBy: { order: 'desc' },
            });

            const story = await this.prisma.story.create({
                data: {
                    roomId,
                    title: title || 'New Story',
                    description,
                    order: (maxOrderStory?.order ?? -1) + 1,
                    status: 'pending',
                },
            });

            // Notify room
            this.server.to(roomId).emit('story-added', {
                story,
                timestamp: new Date().toISOString(),
            });

            return { success: true, story };
        } catch (error) {
            console.error('Error adding story:', error);
            return { success: false, error: 'Failed to add story' };
        }
    }

    @SubscribeMessage('update-story')
    async handleUpdateStory(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: StoryPayload,
    ) {
        const { roomId, storyId, ...data } = payload;

        try {
            const story = await this.prisma.story.update({
                where: { id: storyId },
                data,
            });

            // Notify room
            this.server.to(roomId).emit('story-updated', {
                story,
                timestamp: new Date().toISOString(),
            });

            return { success: true, story };
        } catch (error) {
            console.error('Error updating story:', error);
            return { success: false, error: 'Failed to update story' };
        }
    }

    @SubscribeMessage('delete-story')
    async handleDeleteStory(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { roomId: string; storyId: string },
    ) {
        const { roomId, storyId } = payload;

        try {
            await this.prisma.story.delete({
                where: { id: storyId },
            });

            // Notify room
            this.server.to(roomId).emit('story-deleted', {
                storyId,
                timestamp: new Date().toISOString(),
            });

            return { success: true };
        } catch (error) {
            console.error('Error deleting story:', error);
            return { success: false, error: 'Failed to delete story' };
        }
    }

    @SubscribeMessage('start-voting')
    async handleStartVoting(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { roomId: string; storyId: string },
    ) {
        const { roomId, storyId } = payload;

        try {
            // Update story status
            await this.prisma.story.update({
                where: { id: storyId },
                data: { status: 'voting' },
            });

            // Notify room
            this.server.to(roomId).emit('voting-started', {
                storyId,
                timestamp: new Date().toISOString(),
            });

            return { success: true };
        } catch (error) {
            console.error('Error starting voting:', error);
            return { success: false, error: 'Failed to start voting' };
        }
    }

    @SubscribeMessage('set-estimate')
    async handleSetEstimate(
        @ConnectedSocket() client: Socket,
        @MessageBody()
        payload: { roomId: string; storyId: string; estimate: string },
    ) {
        const { roomId, storyId, estimate } = payload;

        try {
            const story = await this.prisma.story.update({
                where: { id: storyId },
                data: { estimate, status: 'completed' },
            });

            // Notify room
            this.server.to(roomId).emit('estimate-set', {
                storyId,
                estimate,
                timestamp: new Date().toISOString(),
            });

            return { success: true, story };
        } catch (error) {
            console.error('Error setting estimate:', error);
            return { success: false, error: 'Failed to set estimate' };
        }
    }

    @SubscribeMessage('send-message')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: MessagePayload,
    ) {
        const { roomId, participantId, participantName, message } = payload;

        // Broadcast message to room
        this.server.to(roomId).emit('message-received', {
            participantId,
            participantName,
            message,
            timestamp: new Date().toISOString(),
        });

        return { success: true };
    }

    private async emitRoomState(roomId: string, client?: Socket) {
        try {
            const room = await this.prisma.room.findUnique({
                where: { id: roomId },
                include: {
                    stories: {
                        orderBy: { order: 'asc' },
                        include: {
                            votes: true,
                        },
                    },
                    participants: {
                        orderBy: { joinedAt: 'asc' },
                    },
                },
            });

            if (room) {
                const target = client || this.server.to(roomId);
                target.emit('room-state', {
                    room,
                    timestamp: new Date().toISOString(),
                });
            }
        } catch (error) {
            console.error('Error emitting room state:', error);
        }
    }

    private calculateStatistics(
        votes: Array<{ value: string; participant?: { name: string } }>,
    ) {
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

        const distribution: Record<string, number> = {};
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
        const average = Math.round((sum / numericVotes.length) * 100) / 100;

        let median: number;
        const mid = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) {
            median = (sorted[mid - 1] + sorted[mid]) / 2;
        } else {
            median = sorted[mid];
        }

        return {
            count: votes.length,
            average,
            median,
            min: Math.min(...numericVotes),
            max: Math.max(...numericVotes),
            distribution,
            consensus,
        };
    }
}
