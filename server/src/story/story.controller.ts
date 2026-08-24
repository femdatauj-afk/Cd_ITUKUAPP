import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StoryService } from './story.service';

@Controller('stories')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Get()
  getStories() {
    return this.storyService.listStories();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createStory(
    @Req() req: any,
    @Body()
    body: { content?: string; mediaUrl?: string; durationHours?: number },
  ) {
    return this.storyService.createStory(
      req.user.id,
      body.content,
      body.mediaUrl,
      body.durationHours,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':storyId')
  deleteStory(@Req() req: any, @Param('storyId') storyId: string) {
    return this.storyService.deleteStory(storyId, req.user.id);
  }
}
