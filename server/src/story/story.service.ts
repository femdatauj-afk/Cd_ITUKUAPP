import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoryService {
  constructor(private readonly prisma: PrismaService) {}

  async createStory(
    authorId: string,
    content?: string,
    mediaUrl?: string,
    durationHours = 24,
  ) {
    if (!content?.trim() && !mediaUrl?.trim()) {
      throw new BadRequestException('Story content or media is required.');
    }

    const hours = Math.min(Math.max(Number(durationHours) || 24, 1), 24);
    return this.prisma.story.create({
      data: {
        authorId,
        content: content?.trim() || null,
        mediaUrl: mediaUrl?.trim() || null,
        expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
            village: true,
          },
        },
      },
    });
  }

  async listStories() {
    return this.prisma.story.findMany({
      where: { expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
            village: true,
          },
        },
      },
    });
  }

  async deleteStory(storyId: string, authorId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });
    if (!story || story.authorId !== authorId)
      throw new NotFoundException('Story not found.');

    await this.prisma.story.delete({ where: { id: storyId } });
    return { success: true };
  }
}
