import {
  Body,
  Delete,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('feed')
  getFeed(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.communityService.getFeed(
      Number(limit) || 20,
      Number(offset) || 0,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('posts')
  createPost(@Req() req: any, @Body() body: { content: string; photo?: string }) {
    return this.communityService.createPost(req.user.id, body.content, body.photo);
  }

  @Get('villages')
  getVillages() {
    return this.communityService.getVillages();
  }

  @Get('villages/:name')
  getVillage(@Param('name') name: string) {
    return this.communityService.getVillage(name);
  }

  @Get('groups')
  getGroups() {
    return this.communityService.getGroups();
  }

  @UseGuards(JwtAuthGuard)
  @Post('groups')
  createGroup(
    @Req() req: any,
    @Body() body: { name: string; category?: string },
  ) {
    return this.communityService.createGroup(
      req.user.id,
      body.name,
      body.category,
    );
  }

  @Get('pages')
  getPages() {
    return this.communityService.getPages();
  }

  @Get('pages/:pageId')
  @UseGuards(OptionalJwtAuthGuard)
  getPage(@Param('pageId') pageId: string, @Req() req?: any) {
    return this.communityService.getPage(pageId, req?.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('pages/:pageId/follow')
  followPage(@Param('pageId') pageId: string, @Req() req: any) {
    return this.communityService.followPage(pageId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('pages/:pageId/follow')
  unfollowPage(@Param('pageId') pageId: string, @Req() req: any) {
    return this.communityService.unfollowPage(pageId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pages/:pageId/settings')
  getPageSettings(@Param('pageId') pageId: string, @Req() req: any) {
    return this.communityService.getPageSettings(pageId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('pages/:pageId/settings')
  updatePageSettings(@Param('pageId') pageId: string, @Req() req: any, @Body() body: Record<string, any>) {
    return this.communityService.updatePageSettings(pageId, req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('pages/:pageId/profile')
  updatePageProfile(@Param('pageId') pageId: string, @Req() req: any, @Body() body: Record<string, any>) {
    return this.communityService.updatePageProfile(pageId, req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pages/:pageId/analytics')
  getPageAnalytics(@Param('pageId') pageId: string, @Req() req: any) {
    return this.communityService.getPageAnalytics(pageId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pages/:pageId/members')
  getPageMembers(@Param('pageId') pageId: string, @Req() req: any) {
    return this.communityService.getPageMembers(pageId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('pages/:pageId/members/:userId')
  updatePageMember(
    @Param('pageId') pageId: string,
    @Param('userId') userId: string,
    @Req() req: any,
    @Body() body: { role: string },
  ) {
    return this.communityService.updatePageMember(
      pageId,
      req.user.id,
      userId,
      body.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('pages/:pageId/members/:userId')
  removePageMember(
    @Param('pageId') pageId: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    return this.communityService.removePageMember(pageId, req.user.id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('pages')
  createPage(
    @Req() req: any,
    @Body() body: { name: string; category: string },
  ) {
    return this.communityService.createPage(
      req.user.id,
      body.name,
      body.category,
    );
  }

  @Get('marketplace')
  getMarketplaceListings() {
    return this.communityService.getMarketplaceListings();
  }

  @UseGuards(JwtAuthGuard)
  @Post('marketplace')
  createMarketplaceListing(
    @Req() req: any,
    @Body()
    body: {
      title: string;
      description: string;
      category: string;
      condition?: string;
      price: number;
      village: string;
      contactPreference?: string;
      latitude?: number;
      longitude?: number;
      images?: Array<{ url: string; isPrimary?: boolean }>;
    },
  ) {
    return this.communityService.createMarketplaceListing(req.user.id, body);
  }
}
