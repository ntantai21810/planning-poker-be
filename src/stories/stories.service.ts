import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoryDto, UpdateStoryDto } from './dto/story.dto';

@Injectable()
export class StoriesService {
    constructor(private prisma: PrismaService) { }

    async create(roomId: string, createStoryDto: CreateStoryDto) {
        // Get the max order for the room
        const maxOrderStory = await this.prisma.story.findFirst({
            where: { roomId },
            orderBy: { order: 'desc' },
        });

        const order = createStoryDto.order ?? (maxOrderStory?.order ?? -1) + 1;

        const story = await this.prisma.story.create({
            data: {
                roomId,
                title: createStoryDto.title,
                description: createStoryDto.description,
                order,
                status: 'pending',
            },
        });

        return story;
    }

    async findAllByRoom(roomId: string) {
        return this.prisma.story.findMany({
            where: { roomId },
            orderBy: { order: 'asc' },
            include: {
                votes: {
                    include: { participant: true },
                },
            },
        });
    }

    async findOne(id: string) {
        const story = await this.prisma.story.findUnique({
            where: { id },
            include: {
                votes: {
                    include: { participant: true },
                },
            },
        });

        if (!story) {
            throw new NotFoundException(`Story with ID ${id} not found`);
        }

        return story;
    }

    async update(id: string, updateStoryDto: UpdateStoryDto) {
        await this.findOne(id); // Check if story exists

        return this.prisma.story.update({
            where: { id },
            data: updateStoryDto,
        });
    }

    async delete(id: string) {
        await this.findOne(id); // Check if story exists

        return this.prisma.story.delete({
            where: { id },
        });
    }

    async reorder(roomId: string, storyIds: string[]) {
        const updates = storyIds.map((id, index) =>
            this.prisma.story.update({
                where: { id },
                data: { order: index },
            }),
        );

        await this.prisma.$transaction(updates);

        return this.findAllByRoom(roomId);
    }

    async setStatus(id: string, status: string) {
        return this.prisma.story.update({
            where: { id },
            data: { status },
        });
    }

    async setEstimate(id: string, estimate: string) {
        return this.prisma.story.update({
            where: { id },
            data: {
                estimate,
                status: 'completed',
            },
        });
    }
}
