import { PrismaService } from '../prisma/prisma.service';
import { CreateStoryDto, UpdateStoryDto } from './dto/story.dto';
export declare class StoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(roomId: string, createStoryDto: CreateStoryDto): Promise<{
        id: string;
        createdAt: Date;
        order: number;
        roomId: string;
        title: string;
        description: string | null;
        estimate: string | null;
        status: string;
    }>;
    findAllByRoom(roomId: string): Promise<({
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
    } & {
        id: string;
        createdAt: Date;
        order: number;
        roomId: string;
        title: string;
        description: string | null;
        estimate: string | null;
        status: string;
    })[]>;
    findOne(id: string): Promise<{
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
    } & {
        id: string;
        createdAt: Date;
        order: number;
        roomId: string;
        title: string;
        description: string | null;
        estimate: string | null;
        status: string;
    }>;
    update(id: string, updateStoryDto: UpdateStoryDto): Promise<{
        id: string;
        createdAt: Date;
        order: number;
        roomId: string;
        title: string;
        description: string | null;
        estimate: string | null;
        status: string;
    }>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        order: number;
        roomId: string;
        title: string;
        description: string | null;
        estimate: string | null;
        status: string;
    }>;
    reorder(roomId: string, storyIds: string[]): Promise<({
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
    } & {
        id: string;
        createdAt: Date;
        order: number;
        roomId: string;
        title: string;
        description: string | null;
        estimate: string | null;
        status: string;
    })[]>;
    setStatus(id: string, status: string): Promise<{
        id: string;
        createdAt: Date;
        order: number;
        roomId: string;
        title: string;
        description: string | null;
        estimate: string | null;
        status: string;
    }>;
    setEstimate(id: string, estimate: string): Promise<{
        id: string;
        createdAt: Date;
        order: number;
        roomId: string;
        title: string;
        description: string | null;
        estimate: string | null;
        status: string;
    }>;
}
