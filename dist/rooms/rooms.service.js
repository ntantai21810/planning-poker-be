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
exports.RoomsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RoomsService = class RoomsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createRoomDto) {
        const room = await this.prisma.room.create({
            data: {
                name: createRoomDto.name,
                password: createRoomDto.password,
                votingScale: createRoomDto.votingScale || 'fibonacci',
                customScale: createRoomDto.customScale || [],
                isAnonymous: createRoomDto.isAnonymous || false,
                autoReveal: createRoomDto.autoReveal ?? true,
            },
        });
        return room;
    }
    async findOne(id) {
        const room = await this.prisma.room.findUnique({
            where: { id },
            include: {
                stories: {
                    orderBy: { order: 'asc' },
                },
                participants: {
                    orderBy: { joinedAt: 'asc' },
                },
            },
        });
        if (!room) {
            throw new common_1.NotFoundException(`Room with ID ${id} not found`);
        }
        return room;
    }
    async update(id, updateRoomDto) {
        await this.findOne(id);
        return this.prisma.room.update({
            where: { id },
            data: updateRoomDto,
        });
    }
    async delete(id) {
        await this.findOne(id);
        return this.prisma.room.delete({
            where: { id },
        });
    }
    async join(id, joinRoomDto) {
        const room = await this.prisma.room.findUnique({
            where: { id },
            include: { participants: true },
        });
        if (!room) {
            throw new common_1.NotFoundException(`Room with ID ${id} not found`);
        }
        if (room.password && room.password !== joinRoomDto.password) {
            throw new common_1.ForbiddenException('Invalid room password');
        }
        const isFirstParticipant = room.participants.length === 0;
        const participant = await this.prisma.participant.create({
            data: {
                roomId: id,
                name: joinRoomDto.name,
                role: isFirstParticipant ? 'facilitator' : joinRoomDto.role || 'voter',
                isOnline: true,
            },
        });
        return participant;
    }
    async getParticipants(id) {
        await this.findOne(id);
        return this.prisma.participant.findMany({
            where: { roomId: id },
            orderBy: { joinedAt: 'asc' },
        });
    }
    async updateParticipant(participantId, data) {
        return this.prisma.participant.update({
            where: { id: participantId },
            data,
        });
    }
    async removeParticipant(participantId) {
        return this.prisma.participant.delete({
            where: { id: participantId },
        });
    }
    async getRoomWithVotes(id, storyId) {
        const room = await this.prisma.room.findUnique({
            where: { id },
            include: {
                stories: {
                    orderBy: { order: 'asc' },
                    include: {
                        votes: storyId
                            ? {
                                where: { storyId },
                                include: { participant: true },
                            }
                            : {
                                include: { participant: true },
                            },
                    },
                },
                participants: {
                    orderBy: { joinedAt: 'asc' },
                },
            },
        });
        if (!room) {
            throw new common_1.NotFoundException(`Room with ID ${id} not found`);
        }
        return room;
    }
    async exportRoom(id) {
        const room = await this.getRoomWithVotes(id);
        return {
            roomName: room.name,
            votingScale: room.votingScale,
            exportedAt: new Date().toISOString(),
            stories: room.stories.map((story) => ({
                title: story.title,
                description: story.description,
                estimate: story.estimate,
                status: story.status,
                votes: story.votes.map((vote) => ({
                    participant: vote.participant.name,
                    value: vote.value,
                })),
            })),
            participants: room.participants.map((p) => ({
                name: p.name,
                role: p.role,
            })),
        };
    }
};
exports.RoomsService = RoomsService;
exports.RoomsService = RoomsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RoomsService);
//# sourceMappingURL=rooms.service.js.map