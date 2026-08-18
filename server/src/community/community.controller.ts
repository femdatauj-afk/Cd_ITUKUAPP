import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('feed')
  getFeed() {
    return this.communityService.getFeed();
  }

  @UseGuards(JwtAuthGuard)
  @Post('posts')
  createPost(@Req() req: any, @Body() body: { content: string }) {
    return this.communityService.createPost(req.user.id, body.content);
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
  createGroup(@Req() req: any, @Body() body: { name: string; category?: string }) {
    return this.communityService.createGroup(req.user.id, body.name, body.category);
  }

  @Get('pages')
  getPages() {
    return this.communityService.getPages();
  }

  @UseGuards(JwtAuthGuard)
  @Post('pages')
  createPage(@Req() req: any, @Body() body: { name: string; category: string }) {
    return this.communityService.createPage(req.user.id, body.name, body.category);
  }

  @Get('marketplace')
  getMarketplaceListings() {
    return this.communityService.getMarketplaceListings();
  }

  @UseGuards(JwtAuthGuard)
  @Post('marketplace')
  createMarketplaceListing(@Req() req: any, @Body() body: { title: string; description: string; category: string; condition?: string; price: number; village: string; contactPreference?: string; latitude?: number; longitude?: number; images?: Array<{ url: string; isPrimary?: boolean }> }) {
    return this.communityService.createMarketplaceListing(req.user.id, body);
  }
}
