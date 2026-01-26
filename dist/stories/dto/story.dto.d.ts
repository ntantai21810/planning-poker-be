export declare class CreateStoryDto {
    title: string;
    description?: string;
    order?: number;
}
export declare class UpdateStoryDto {
    title?: string;
    description?: string;
    order?: number;
    estimate?: string;
    status?: 'pending' | 'voting' | 'completed' | 'skipped';
}
export declare class ReorderStoriesDto {
    storyIds: string[];
}
