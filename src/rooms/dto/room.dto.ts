import {
    IsString,
    IsOptional,
    IsBoolean,
    IsArray,
    MinLength,
    MaxLength,
} from 'class-validator';

export class CreateRoomDto {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    name: string;

    @IsOptional()
    @IsString()
    password?: string;

    @IsOptional()
    @IsString()
    votingScale?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    customScale?: string[];

    @IsOptional()
    @IsBoolean()
    isAnonymous?: boolean;

    @IsOptional()
    @IsBoolean()
    autoReveal?: boolean;
}

export class UpdateRoomDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsString()
    votingScale?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    customScale?: string[];

    @IsOptional()
    @IsBoolean()
    isAnonymous?: boolean;

    @IsOptional()
    @IsBoolean()
    autoReveal?: boolean;
}

export class JoinRoomDto {
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    name: string;

    @IsOptional()
    @IsString()
    password?: string;

    @IsOptional()
    @IsString()
    role?: 'voter' | 'observer';
}
