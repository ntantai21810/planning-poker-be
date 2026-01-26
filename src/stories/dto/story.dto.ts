import {
    IsString,
    IsOptional,
    IsInt,
    MinLength,
    MaxLength,
    Min,
} from 'class-validator';

export class CreateStoryDto {
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    title: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    order?: number;
}

export class UpdateStoryDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    title?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    order?: number;

    @IsOptional()
    @IsString()
    estimate?: string;

    @IsOptional()
    @IsString()
    status?: 'pending' | 'voting' | 'completed' | 'skipped';
}

export class ReorderStoriesDto {
    @IsString({ each: true })
    storyIds: string[];
}
