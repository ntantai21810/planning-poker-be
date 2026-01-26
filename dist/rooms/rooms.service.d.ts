import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto, UpdateRoomDto, JoinRoomDto } from './dto/room.dto';
export declare class RoomsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createRoomDto: CreateRoomDto): Promise<{
        name: string;
        password: string | null;
        votingScale: string;
        customScale: string[];
        isAnonymous: boolean;
        autoReveal: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findOne(id: string): Promise<{
        stories: {
            id: string;
            createdAt: Date;
            order: number;
            roomId: string;
            title: string;
            description: string | null;
            estimate: string | null;
            status: string;
        }[];
        participants: {
            name: string;
            role: string;
            id: string;
            joinedAt: Date;
            roomId: string;
            isOnline: boolean;
        }[];
    } & {
        name: string;
        password: string | null;
        votingScale: string;
        customScale: string[];
        isAnonymous: boolean;
        autoReveal: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updateRoomDto: UpdateRoomDto): Promise<{
        name: string;
        password: string | null;
        votingScale: string;
        customScale: string[];
        isAnonymous: boolean;
        autoReveal: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    delete(id: string): Promise<{
        name: string;
        password: string | null;
        votingScale: string;
        customScale: string[];
        isAnonymous: boolean;
        autoReveal: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    join(id: string, joinRoomDto: JoinRoomDto): Promise<{
        name: string;
        role: string;
        id: string;
        joinedAt: Date;
        roomId: string;
        isOnline: boolean;
    }>;
    getParticipants(id: string): Promise<{
        name: string;
        role: string;
        id: string;
        joinedAt: Date;
        roomId: string;
        isOnline: boolean;
    }[]>;
    updateParticipant(participantId: string, data: {
        isOnline?: boolean;
        role?: string;
    }): Promise<{
        name: string;
        role: string;
        id: string;
        joinedAt: Date;
        roomId: string;
        isOnline: boolean;
    }>;
    removeParticipant(participantId: string): Promise<{
        name: string;
        role: string;
        id: string;
        joinedAt: Date;
        roomId: string;
        isOnline: boolean;
    }>;
    getRoomWithVotes(id: string, storyId?: string): Promise<{
        stories: ({
            votes: (({
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
            }) | ({
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
            }))[];
        } & {
            id: string;
            createdAt: Date;
            order: number;
            roomId: string;
            title: string;
            description: string | null;
            estimate: string | null;
            status: string;
        })[];
        participants: {
            name: string;
            role: string;
            id: string;
            joinedAt: Date;
            roomId: string;
            isOnline: boolean;
        }[];
    } & {
        name: string;
        password: string | null;
        votingScale: string;
        customScale: string[];
        isAnonymous: boolean;
        autoReveal: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    exportRoom(id: string): Promise<{
        roomName: string;
        votingScale: string;
        exportedAt: string;
        stories: {
            title: string;
            description: string | null;
            estimate: string | null;
            status: string;
            votes: {
                participant: string;
                value: string;
            }[];
        }[];
        participants: {
            name: string;
            role: string;
        }[];
    }>;
}
