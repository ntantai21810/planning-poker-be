import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto, UpdateRoomDto, JoinRoomDto } from './dto/room.dto';

@Injectable()
export class RoomsService {
    constructor(private prisma: PrismaService) { }

    async create(createRoomDto: CreateRoomDto) {
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

    async findOne(id: string) {
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
            throw new NotFoundException(`Room with ID ${id} not found`);
        }

        return room;
    }

    async update(id: string, updateRoomDto: UpdateRoomDto) {
        await this.findOne(id); // Check if room exists

        return this.prisma.room.update({
            where: { id },
            data: updateRoomDto,
        });
    }

    async delete(id: string) {
        await this.findOne(id); // Check if room exists

        return this.prisma.room.delete({
            where: { id },
        });
    }

    async join(id: string, joinRoomDto: JoinRoomDto) {
        const room = await this.prisma.room.findUnique({
            where: { id },
            include: { participants: true },
        });

        if (!room) {
            throw new NotFoundException(`Room with ID ${id} not found`);
        }

        // Check password if room is protected
        if (room.password && room.password !== joinRoomDto.password) {
            throw new ForbiddenException('Invalid room password');
        }

        // Check if this is the first participant (becomes facilitator)
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

    async getParticipants(id: string) {
        await this.findOne(id); // Check if room exists

        return this.prisma.participant.findMany({
            where: { roomId: id },
            orderBy: { joinedAt: 'asc' },
        });
    }

    async updateParticipant(
        participantId: string,
        data: { isOnline?: boolean; role?: string },
    ) {
        return this.prisma.participant.update({
            where: { id: participantId },
            data,
        });
    }

    async removeParticipant(participantId: string) {
        return this.prisma.participant.delete({
            where: { id: participantId },
        });
    }

    async getRoomWithVotes(id: string, storyId?: string) {
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
            throw new NotFoundException(`Room with ID ${id} not found`);
        }

        return room;
    }

    async exportRoom(id: string) {
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
}
