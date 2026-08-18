import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GroupPostService } from './group-post.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('groups/:groupId/posts')
@UseGuards(JwtAuthGuard)
export class GroupPostController {
  constructor(private readonly groupPostService: GroupPostService) {}

  /**
   * Create a new post in a group
   * POST /groups/:groupId/posts
   */
  @Post()
  async createPost(
    @Param('groupId') groupId: string,
    @Body() body: { content: string; photo?: string },
    @Request() req: any,
  ) {
    return this.groupPostService.createPost(
      groupId,
      req.user.id,
      body.content,
      body.photo,
    );
  }

  /**
   * Get all posts in a group
   * GET /groups/:groupId/posts?limit=50&offset=0
   */
  @Get()
  async getGroupPosts(
    @Param('groupId') groupId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    return this.groupPostService.getGroupPosts(groupId, parsedLimit, parsedOffset);
  }

  /**
   * Get a specific post
   * GET /groups/:groupId/posts/:postId
   */
  @Get(':postId')
  async getPost(
    @Param('groupId') groupId: string,
    @Param('postId') postId: string,
  ) {
    return this.groupPostService.getPost(postId);
  }

  /**
   * Update a post
   * PUT /groups/:groupId/posts/:postId
   */
  @Put(':postId')
  async updatePost(
    @Param('groupId') groupId: string,
    @Param('postId') postId: string,
    @Body() body: { content?: string; photo?: string },
    @Request() req: any,
  ) {
    return this.groupPostService.updatePost(postId, req.user.id, body.content, body.photo);
  }

  /**
   * Delete a post
   * DELETE /groups/:groupId/posts/:postId
   */
  @Delete(':postId')
  async deletePost(
    @Param('groupId') groupId: string,
    @Param('postId') postId: string,
    @Request() req: any,
  ) {
    return this.groupPostService.deletePost(postId, req.user.id);
  }

  /**
   * Like a post
   * PUT /groups/:groupId/posts/:postId/like
   */
  @Put(':postId/like')
  async likePost(
    @Param('groupId') groupId: string,
    @Param('postId') postId: string,
    @Request() req: any,
  ) {
    return this.groupPostService.likePost(postId, req.user.id);
  }

  /**
   * Unlike a post
   * DELETE /groups/:groupId/posts/:postId/like
   */
  @Delete(':postId/like')
  async unlikePost(
    @Param('groupId') groupId: string,
    @Param('postId') postId: string,
    @Request() req: any,
  ) {
    return this.groupPostService.unlikePost(postId, req.user.id);
  }

  /**
   * Increment comment count
   * PUT /groups/:groupId/posts/:postId/increment-comments
   */
  @Put(':postId/increment-comments')
  async incrementComments(
    @Param('groupId') groupId: string,
    @Param('postId') postId: string,
  ) {
    return this.groupPostService.incrementComments(postId);
  }

  /**
   * Decrement comment count
   * PUT /groups/:groupId/posts/:postId/decrement-comments
   */
  @Put(':postId/decrement-comments')
  async decrementComments(
    @Param('groupId') groupId: string,
    @Param('postId') postId: string,
  ) {
    return this.groupPostService.decrementComments(postId);
  }
}
