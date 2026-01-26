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
exports.StoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let StoriesService = class StoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(roomId, createStoryDto) {
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
    async findAllByRoom(roomId) {
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
    async findOne(id) {
        const story = await this.prisma.story.findUnique({
            where: { id },
            include: {
                votes: {
                    include: { participant: true },
                },
            },
        });
        if (!story) {
            throw new common_1.NotFoundException(`Story with ID ${id} not found`);
        }
        return story;
    }
    async update(id, updateStoryDto) {
        await this.findOne(id);
        return this.prisma.story.update({
            where: { id },
            data: updateStoryDto,
        });
    }
    async delete(id) {
        await this.findOne(id);
        return this.prisma.story.delete({
            where: { id },
        });
    }
    async reorder(roomId, storyIds) {
        const updates = storyIds.map((id, index) => this.prisma.story.update({
            where: { id },
            data: { order: index },
        }));
        await this.prisma.$transaction(updates);
        return this.findAllByRoom(roomId);
    }
    async setStatus(id, status) {
        return this.prisma.story.update({
            where: { id },
            data: { status },
        });
    }
    async setEstimate(id, estimate) {
        return this.prisma.story.update({
            where: { id },
            data: {
                estimate,
                status: 'completed',
            },
        });
    }
};
exports.StoriesService = StoriesService;
exports.StoriesService = StoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StoriesService);
//# sourceMappingURL=stories.service.js.map