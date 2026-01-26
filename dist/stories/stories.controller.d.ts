import { StoriesService } from './stories.service';
import { CreateStoryDto, UpdateStoryDto, ReorderStoriesDto } from './dto/story.dto';
export declare class StoriesController {
    private readonly storiesService;
    constructor(storiesService: StoriesService);
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
    delete(id: string): Promise<void>;
    reorder(roomId: string, reorderDto: ReorderStoriesDto): Promise<({
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
}
