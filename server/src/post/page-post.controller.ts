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
import { PagePostService } from './page-post.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('pages/:pageId/posts')
@UseGuards(JwtAuthGuard)
export class PagePostController {
  constructor(private readonly pagePostService: PagePostService) {}

  /**
   * Create a new post on a page
   * POST /pages/:pageId/posts
   */
  @Post()
  async createPost(
    @Param('pageId') pageId: string,
    @Body() body: { content: string; photo?: string },
    @Request() req: any,
  ) {
    return this.pagePostService.createPost(
      pageId,
      req.user.id,
      body.content,
      body.photo,
    );
  }

  /**
   * Get all posts on a page
   * GET /pages/:pageId/posts?limit=50&offset=0
   */
  @Get()
  async getPagePosts(
    @Param('pageId') pageId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    return this.pagePostService.getPagePosts(pageId, parsedLimit, parsedOffset);
  }

  /**
   * Get a specific post
   * GET /pages/:pageId/posts/:postId
   */
  @Get(':postId')
  async getPost(
    @Param('pageId') pageId: string,
    @Param('postId') postId: string,
  ) {
    return this.pagePostService.getPost(postId);
  }

  /**
   * Update a post
   * PUT /pages/:pageId/posts/:postId
   */
  @Put(':postId')
  async updatePost(
    @Param('pageId') pageId: string,
    @Param('postId') postId: string,
    @Body() body: { content?: string; photo?: string },
    @Request() req: any,
  ) {
    return this.pagePostService.updatePost(postId, req.user.id, body.content, body.photo);
  }

  /**
   * Delete a post
   * DELETE /pages/:pageId/posts/:postId
   */
  @Delete(':postId')
  async deletePost(
    @Param('pageId') pageId: string,
    @Param('postId') postId: string,
    @Request() req: any,
  ) {
    return this.pagePostService.deletePost(postId, req.user.id);
  }

  /**
   * Like a post
   * PUT /pages/:pageId/posts/:postId/like
   */
  @Put(':postId/like')
  async likePost(
    @Param('pageId') pageId: string,
    @Param('postId') postId: string,
    @Request() req: any,
  ) {
    return this.pagePostService.likePost(postId, req.user.id);
  }

  /**
   * Unlike a post
   * DELETE /pages/:pageId/posts/:postId/like
   */
  @Delete(':postId/like')
  async unlikePost(
    @Param('pageId') pageId: string,
    @Param('postId') postId: string,
    @Request() req: any,
  ) {
    return this.pagePostService.unlikePost(postId, req.user.id);
  }

  /**
   * Increment comment count
   * PUT /pages/:pageId/posts/:postId/increment-comments
   */
  @Put(':postId/increment-comments')
  async incrementComments(
    @Param('pageId') pageId: string,
    @Param('postId') postId: string,
  ) {
    return this.pagePostService.incrementComments(postId);
  }

  /**
   * Decrement comment count
   * PUT /pages/:pageId/posts/:postId/decrement-comments
   */
  @Put(':postId/decrement-comments')
  async decrementComments(
    @Param('pageId') pageId: string,
    @Param('postId') postId: string,
  ) {
    return this.pagePostService.decrementComments(postId);
  }
}
