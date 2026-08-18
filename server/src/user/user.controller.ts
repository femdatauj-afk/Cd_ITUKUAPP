import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly users: UserService) {}
  @UseGuards(JwtAuthGuard) @Get('directory') directory(@Req() req: any, @Query('q') q?: string) { return this.users.discoverPeople(req.user.id, q); }
  @UseGuards(JwtAuthGuard) @Get(':userId/friends') friends(@Param('userId') id: string) { return this.users.getFriends(id); }
  @UseGuards(JwtAuthGuard) @Get(':userId/mutual-friends') mutual(@Req() req: any, @Param('userId') id: string) { return this.users.getMutualFriends(req.user.id, id); }
  @UseGuards(JwtAuthGuard) @Post('friend-request/:targetUserId') request(@Req() req: any, @Param('targetUserId') id: string) { return this.users.sendFriendRequest(req.user.id, id); }
  @UseGuards(JwtAuthGuard) @Post('friend-request/:requestId/accept') accept(@Req() req: any, @Param('requestId') id: string) { return this.users.acceptFriendRequest(req.user.id, id); }
  @UseGuards(JwtAuthGuard) @Delete('friend-request/:requestId') decline(@Req() req: any, @Param('requestId') id: string) { return this.users.declineFriendRequest(req.user.id, id); }
  @UseGuards(JwtAuthGuard) @Get('friend-requests') requests(@Req() req: any) { return this.users.getFriendRequests(req.user.id); }
  @Get('profile/:usernameOrId') profile(@Param('usernameOrId') id: string, @Req() req: any) { return this.users.getUserProfile(id, req.user?.id); }
  @UseGuards(JwtAuthGuard) @Put('profile') update(@Req() req: any, @Body() body: { fullName?: string; bio?: string; profilePhoto?: string; coverPhoto?: string }) { return this.users.updateProfile(req.user.id, body); }
}
