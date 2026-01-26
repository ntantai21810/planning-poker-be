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
import { RoomsService } from './rooms.service';
import { CreateRoomDto, UpdateRoomDto, JoinRoomDto } from './dto/room.dto';

@Controller('api/rooms')
export class RoomsController {
    constructor(private readonly roomsService: RoomsService) { }

    @Post()
    async create(@Body() createRoomDto: CreateRoomDto) {
        return this.roomsService.create(createRoomDto);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.roomsService.findOne(id);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
        return this.roomsService.update(id, updateRoomDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Param('id') id: string) {
        await this.roomsService.delete(id);
    }

    @Post(':id/join')
    async join(@Param('id') id: string, @Body() joinRoomDto: JoinRoomDto) {
        return this.roomsService.join(id, joinRoomDto);
    }

    @Get(':id/participants')
    async getParticipants(@Param('id') id: string) {
        return this.roomsService.getParticipants(id);
    }

    @Get(':id/export')
    async exportRoom(@Param('id') id: string) {
        return this.roomsService.exportRoom(id);
    }
}
