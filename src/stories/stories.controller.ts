import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { StoriesService } from './stories.service';
import { CreateStoryDto, UpdateStoryDto, ReorderStoriesDto } from './dto/story.dto';

@Controller('api')
export class StoriesController {
    constructor(private readonly storiesService: StoriesService) { }

    @Post('rooms/:roomId/stories')
    async create(
        @Param('roomId') roomId: string,
        @Body() createStoryDto: CreateStoryDto,
    ) {
        return this.storiesService.create(roomId, createStoryDto);
    }

    @Get('rooms/:roomId/stories')
    async findAllByRoom(@Param('roomId') roomId: string) {
        return this.storiesService.findAllByRoom(roomId);
    }

    @Get('stories/:id')
    async findOne(@Param('id') id: string) {
        return this.storiesService.findOne(id);
    }

    @Patch('stories/:id')
    async update(
        @Param('id') id: string,
        @Body() updateStoryDto: UpdateStoryDto,
    ) {
        return this.storiesService.update(id, updateStoryDto);
    }

    @Delete('stories/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Param('id') id: string) {
        await this.storiesService.delete(id);
    }

    @Post('rooms/:roomId/stories/reorder')
    async reorder(
        @Param('roomId') roomId: string,
        @Body() reorderDto: ReorderStoriesDto,
    ) {
        return this.storiesService.reorder(roomId, reorderDto.storyIds);
    }
}
