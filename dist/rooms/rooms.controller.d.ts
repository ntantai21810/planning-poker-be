import { RoomsService } from './rooms.service';
import { CreateRoomDto, UpdateRoomDto, JoinRoomDto } from './dto/room.dto';
export declare class RoomsController {
    private readonly roomsService;
    constructor(roomsService: RoomsService);
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
    delete(id: string): Promise<void>;
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
