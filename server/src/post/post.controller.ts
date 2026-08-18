import { Controller, Get, Post, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { PostService } from './post.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  // Create post
  @UseGuards(JwtAuthGuard)
  @Post()
  async createPost(@Req() req: any, @Body() body: { content: string; photo?: string }) {
    return this.postService.createPost(req.user.id, body.content, body.photo);
  }

  // Get single post
  @Get(':postId')
  async getPost(@Param('postId') postId: string, @Req() req: any) {
    return this.postService.getPost(postId, req.user?.id);
  }

  // Get feed (posts from following and friends)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getFeed(
    @Req() req: any,
    @Body() body: { limit?: number; offset?: number },
  ) {
    return this.postService.getFeed(req.user.id, body.limit || 20, body.offset || 0);
  }

  // Delete post
  @UseGuards(JwtAuthGuard)
  @Delete(':postId')
  async deletePost(@Param('postId') postId: string, @Req() req: any) {
    return this.postService.deletePost(postId, req.user.id);
  }

  // Like post
  @UseGuards(JwtAuthGuard)
  @Post(':postId/like')
  async likePost(@Param('postId') postId: string, @Req() req: any) {
    return this.postService.likePost(postId, req.user.id);
  }

  // Unlike post
  @UseGuards(JwtAuthGuard)
  @Delete(':postId/like')
  async unlikePost(@Param('postId') postId: string, @Req() req: any) {
    return this.postService.unlikePost(postId, req.user.id);
  }

  // Get likes
  @Get(':postId/likes')
  async getPostLikes(@Param('postId') postId: string) {
    return this.postService.getPostLikes(postId);
  }

  // Add comment
  @UseGuards(JwtAuthGuard)
  @Post(':postId/comments')
  async addComment(
    @Param('postId') postId: string,
    @Req() req: any,
    @Body() body: { content: string },
  ) {
    return this.postService.addComment(postId, req.user.id, body.content);
  }

  // Get comments
  @Get(':postId/comments')
  async getPostComments(@Param('postId') postId: string) {
    return this.postService.getPostComments(postId);
  }

  // Delete comment
  @UseGuards(JwtAuthGuard)
  @Delete('comments/:commentId')
  async deleteComment(@Param('commentId') commentId: string, @Req() req: any) {
    return this.postService.deleteComment(commentId, req.user.id);
  }

  // Share post
  @UseGuards(JwtAuthGuard)
  @Post(':postId/share')
  async sharePost(@Param('postId') postId: string, @Req() req: any) {
    return this.postService.sharePost(postId, req.user.id);
  }

  // Unshare post
  @UseGuards(JwtAuthGuard)
  @Delete(':postId/share')
  async unsharePost(@Param('postId') postId: string, @Req() req: any) {
    return this.postService.unsharePost(postId, req.user.id);
  }
}
