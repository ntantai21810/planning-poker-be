"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoriesController = void 0;
const common_1 = require("@nestjs/common");
const stories_service_1 = require("./stories.service");
const story_dto_1 = require("./dto/story.dto");
let StoriesController = class StoriesController {
    storiesService;
    constructor(storiesService) {
        this.storiesService = storiesService;
    }
    async create(roomId, createStoryDto) {
        return this.storiesService.create(roomId, createStoryDto);
    }
    async findAllByRoom(roomId) {
        return this.storiesService.findAllByRoom(roomId);
    }
    async findOne(id) {
        return this.storiesService.findOne(id);
    }
    async update(id, updateStoryDto) {
        return this.storiesService.update(id, updateStoryDto);
    }
    async delete(id) {
        await this.storiesService.delete(id);
    }
    async reorder(roomId, reorderDto) {
        return this.storiesService.reorder(roomId, reorderDto.storyIds);
    }
};
exports.StoriesController = StoriesController;
__decorate([
    (0, common_1.Post)('rooms/:roomId/stories'),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, story_dto_1.CreateStoryDto]),
    __metadata("design:returntype", Promise)
], StoriesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('rooms/:roomId/stories'),
    __param(0, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StoriesController.prototype, "findAllByRoom", null);
__decorate([
    (0, common_1.Get)('stories/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StoriesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('stories/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, story_dto_1.UpdateStoryDto]),
    __metadata("design:returntype", Promise)
], StoriesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('stories/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StoriesController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('rooms/:roomId/stories/reorder'),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, story_dto_1.ReorderStoriesDto]),
    __metadata("design:returntype", Promise)
], StoriesController.prototype, "reorder", null);
exports.StoriesController = StoriesController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [stories_service_1.StoriesService])
], StoriesController);
//# sourceMappingURL=stories.controller.js.map