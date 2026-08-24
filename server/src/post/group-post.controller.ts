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
import { CommentService } from './comment.service';

@Controller('groups/:groupId/posts')
@UseGuards(JwtAuthGuard)
export class GroupPostController {
  constructor(private readonly groupPostService: GroupPostService, private readonly commentService: CommentService) {}

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
    return this.groupPostService.getGroupPosts(
      groupId,
      parsedLimit,
      parsedOffset,
    );
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
    return this.groupPostService.updatePost(
      postId,
      req.user.id,
      body.content,
      body.photo,
    );
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

  @Get(':postId/comments')
  async getComments(@Param('postId') postId: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.commentService.getPostComments(postId, Number(limit || 50), Number(offset || 0), 'group');
  }

  @Post(':postId/comments')
  async createComment(@Param('postId') postId: string, @Body() body: { content: string; parentId?: string; mediaUrl?: string }, @Request() req: any) {
    return this.commentService.createComment(postId, req.user.id, body.content, body.parentId, body.mediaUrl, 'group');
  }

  @Post(':postId/comments/:commentId/reaction')
  async reactToComment(@Param('commentId') commentId: string, @Request() req: any) {
    return this.commentService.toggleReaction(commentId, req.user.id);
  }

  @Put(':postId/comments/:commentId')
  async editComment(@Param('commentId') commentId: string, @Body() body: { content: string }, @Request() req: any) {
    return this.commentService.updateComment(commentId, req.user.id, body.content);
  }

  @Delete(':postId/comments/:commentId')
  async removeComment(@Param('commentId') commentId: string, @Request() req: any) {
    return this.commentService.deleteComment(commentId, req.user.id, req.user.role, 'group');
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
