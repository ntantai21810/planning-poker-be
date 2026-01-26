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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PokerGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const prisma_service_1 = require("../prisma/prisma.service");
let PokerGateway = class PokerGateway {
    prisma;
    server;
    socketToParticipant = new Map();
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    async handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
        const participantInfo = this.socketToParticipant.get(client.id);
        if (participantInfo) {
            const { roomId, participantId } = participantInfo;
            try {
                await this.prisma.participant.update({
                    where: { id: participantId },
                    data: { isOnline: false },
                });
                this.server.to(roomId).emit('user-left', {
                    participantId,
                    timestamp: new Date().toISOString(),
                });
                await this.emitRoomState(roomId);
            }
            catch (error) {
                console.error('Error handling disconnect:', error);
            }
            this.socketToParticipant.delete(client.id);
        }
    }
    async handleJoinRoom(client, payload) {
        const { roomId, participantId, name } = payload;
        client.join(roomId);
        this.socketToParticipant.set(client.id, { roomId, participantId });
        try {
            await this.prisma.participant.update({
                where: { id: participantId },
                data: { isOnline: true },
            });
        }
        catch (error) {
            console.error('Error updating participant online status:', error);
        }
        client.to(roomId).emit('user-joined', {
            participantId,
            name,
            timestamp: new Date().toISOString(),
        });
        await this.emitRoomState(roomId, client);
        return { success: true };
    }
    async handleLeaveRoom(client, payload) {
        const { roomId, participantId } = payload;
        client.leave(roomId);
        this.socketToParticipant.delete(client.id);
        try {
            await this.prisma.participant.update({
                where: { id: participantId },
                data: { isOnline: false },
            });
        }
        catch (error) {
            console.error('Error updating participant offline status:', error);
        }
        this.server.to(roomId).emit('user-left', {
            participantId,
            timestamp: new Date().toISOString(),
        });
        await this.emitRoomState(roomId);
        return { success: true };
    }
    async handleSubmitVote(client, payload) {
        const { roomId, storyId, participantId, value } = payload;
        try {
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
            this.server.to(roomId).emit('vote-submitted', {
                storyId,
                participantId,
                timestamp: new Date().toISOString(),
            });
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
            const allVoted = room &&
                room.participants.length > 0 &&
                room.participants.every((p) => votes.some((v) => v.participantId === p.id));
            if (allVoted && room?.autoReveal) {
                await this.handleRevealVotes(client, { roomId, storyId });
            }
            return { success: true };
        }
        catch (error) {
            console.error('Error submitting vote:', error);
            return { success: false, error: 'Failed to submit vote' };
        }
    }
    async handleRevealVotes(client, payload) {
        const { roomId, storyId } = payload;
        try {
            const votes = await this.prisma.vote.findMany({
                where: { storyId },
                include: { participant: true },
            });
            const statistics = this.calculateStatistics(votes);
            await this.prisma.story.update({
                where: { id: storyId },
                data: { status: 'completed' },
            });
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
        }
        catch (error) {
            console.error('Error revealing votes:', error);
            return { success: false, error: 'Failed to reveal votes' };
        }
    }
    async handleResetVoting(client, payload) {
        const { roomId, storyId } = payload;
        try {
            await this.prisma.vote.deleteMany({
                where: { storyId },
            });
            await this.prisma.story.update({
                where: { id: storyId },
                data: { status: 'voting', estimate: null },
            });
            this.server.to(roomId).emit('voting-reset', {
                storyId,
                timestamp: new Date().toISOString(),
            });
            return { success: true };
        }
        catch (error) {
            console.error('Error resetting voting:', error);
            return { success: false, error: 'Failed to reset voting' };
        }
    }
    async handleAddStory(client, payload) {
        const { roomId, title, description } = payload;
        try {
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
            this.server.to(roomId).emit('story-added', {
                story,
                timestamp: new Date().toISOString(),
            });
            return { success: true, story };
        }
        catch (error) {
            console.error('Error adding story:', error);
            return { success: false, error: 'Failed to add story' };
        }
    }
    async handleUpdateStory(client, payload) {
        const { roomId, storyId, ...data } = payload;
        try {
            const story = await this.prisma.story.update({
                where: { id: storyId },
                data,
            });
            this.server.to(roomId).emit('story-updated', {
                story,
                timestamp: new Date().toISOString(),
            });
            return { success: true, story };
        }
        catch (error) {
            console.error('Error updating story:', error);
            return { success: false, error: 'Failed to update story' };
        }
    }
    async handleDeleteStory(client, payload) {
        const { roomId, storyId } = payload;
        try {
            await this.prisma.story.delete({
                where: { id: storyId },
            });
            this.server.to(roomId).emit('story-deleted', {
                storyId,
                timestamp: new Date().toISOString(),
            });
            return { success: true };
        }
        catch (error) {
            console.error('Error deleting story:', error);
            return { success: false, error: 'Failed to delete story' };
        }
    }
    async handleStartVoting(client, payload) {
        const { roomId, storyId } = payload;
        try {
            await this.prisma.story.update({
                where: { id: storyId },
                data: { status: 'voting' },
            });
            this.server.to(roomId).emit('voting-started', {
                storyId,
                timestamp: new Date().toISOString(),
            });
            return { success: true };
        }
        catch (error) {
            console.error('Error starting voting:', error);
            return { success: false, error: 'Failed to start voting' };
        }
    }
    async handleSetEstimate(client, payload) {
        const { roomId, storyId, estimate } = payload;
        try {
            const story = await this.prisma.story.update({
                where: { id: storyId },
                data: { estimate, status: 'completed' },
            });
            this.server.to(roomId).emit('estimate-set', {
                storyId,
                estimate,
                timestamp: new Date().toISOString(),
            });
            return { success: true, story };
        }
        catch (error) {
            console.error('Error setting estimate:', error);
            return { success: false, error: 'Failed to set estimate' };
        }
    }
    async handleSendMessage(client, payload) {
        const { roomId, participantId, participantName, message } = payload;
        this.server.to(roomId).emit('message-received', {
            participantId,
            participantName,
            message,
            timestamp: new Date().toISOString(),
        });
        return { success: true };
    }
    async emitRoomState(roomId, client) {
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
        }
        catch (error) {
            console.error('Error emitting room state:', error);
        }
    }
    calculateStatistics(votes) {
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
        const average = Math.round((sum / numericVotes.length) * 100) / 100;
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
            average,
            median,
            min: Math.min(...numericVotes),
            max: Math.max(...numericVotes),
            distribution,
            consensus,
        };
    }
};
exports.PokerGateway = PokerGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], PokerGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], PokerGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave-room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], PokerGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('submit-vote'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], PokerGateway.prototype, "handleSubmitVote", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('reveal-votes'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], PokerGateway.prototype, "handleRevealVotes", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('reset-voting'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], PokerGateway.prototype, "handleResetVoting", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('add-story'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], PokerGateway.prototype, "handleAddStory", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('update-story'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], PokerGateway.prototype, "handleUpdateStory", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('delete-story'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], PokerGateway.prototype, "handleDeleteStory", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('start-voting'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], PokerGateway.prototype, "handleStartVoting", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('set-estimate'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], PokerGateway.prototype, "handleSetEstimate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send-message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], PokerGateway.prototype, "handleSendMessage", null);
exports.PokerGateway = PokerGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PokerGateway);
//# sourceMappingURL=poker.gateway.js.map