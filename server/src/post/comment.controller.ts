import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommentService } from './comment.service';

@Controller('posts/:postId/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  /**
   * POST /posts/:postId/comments
   * Create a new comment on a post
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Param('postId') postId: string,
    @Request() req: any,
    @Body() body: { content: string },
  ) {
    return this.commentService.createComment(postId, req.user.id, body.content);
  }

  /**
   * GET /posts/:postId/comments
   * Get all comments for a post
   */
  @Get()
  async getPostComments(
    @Param('postId') postId: string,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
  ) {
    return this.commentService.getPostComments(postId, parseInt(limit), parseInt(offset));
  }

  /**
   * GET /posts/:postId/comments/:commentId
   * Get a single comment
   */
  @Get(':commentId')
  async getComment(@Param('commentId') commentId: string) {
    return this.commentService.getComment(commentId);
  }

  /**
   * PUT /posts/:postId/comments/:commentId
   * Update a comment
   */
  @Put(':commentId')
  @UseGuards(JwtAuthGuard)
  async updateComment(
    @Param('commentId') commentId: string,
    @Request() req: any,
    @Body() body: { content: string },
  ) {
    return this.commentService.updateComment(commentId, req.user.id, body.content);
  }

  /**
   * DELETE /posts/:postId/comments/:commentId
   * Delete a comment
   */
  @Delete(':commentId')
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @Param('commentId') commentId: string,
    @Request() req: any,
  ) {
    return this.commentService.deleteComment(commentId, req.user.id, req.user.role);
  }
}
