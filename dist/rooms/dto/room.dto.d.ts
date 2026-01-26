export declare class CreateRoomDto {
    name: string;
    password?: string;
    votingScale?: string;
    customScale?: string[];
    isAnonymous?: boolean;
    autoReveal?: boolean;
}
export declare class UpdateRoomDto {
    name?: string;
    votingScale?: string;
    customScale?: string[];
    isAnonymous?: boolean;
    autoReveal?: boolean;
}
export declare class JoinRoomDto {
    name: string;
    password?: string;
    role?: 'voter' | 'observer';
}
