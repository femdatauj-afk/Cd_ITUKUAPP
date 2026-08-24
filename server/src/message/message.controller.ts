import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  // Send message
  @UseGuards(JwtAuthGuard)
  @Post()
  async sendMessage(
    @Req() req: any,
    @Body() body: { receiverId: string; content: string },
  ) {
    return this.messageService.sendMessage(
      req.user.id,
      body.receiverId,
      body.content,
    );
  }

  // Get conversation with a user
  @UseGuards(JwtAuthGuard)
  @Get('conversation/:otherUserId')
  async getConversation(
    @Req() req: any,
    @Param('otherUserId') otherUserId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.messageService.getConversation(
      req.user.id,
      otherUserId,
      Number(limit || 50),
      Number(offset || 0),
    );
  }

  // Get all conversations
  @UseGuards(JwtAuthGuard)
  @Get()
  async getConversations(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.messageService.getConversations(
      req.user.id,
      Number(limit || 20),
      Number(offset || 0),
    );
  }

  // Mark message as read
  @UseGuards(JwtAuthGuard)
  @Post(':messageId/read')
  async markAsRead(@Param('messageId') messageId: string, @Req() req: any) {
    return this.messageService.markAsRead(messageId, req.user.id);
  }

  // Mark conversation as read
  @UseGuards(JwtAuthGuard)
  @Post('conversation/:otherUserId/read')
  async markConversationAsRead(
    @Req() req: any,
    @Param('otherUserId') otherUserId: string,
  ) {
    return this.messageService.markConversationAsRead(req.user.id, otherUserId);
  }

  // Delete message
  @UseGuards(JwtAuthGuard)
  @Delete(':messageId')
  async deleteMessage(@Param('messageId') messageId: string, @Req() req: any) {
    return this.messageService.deleteMessage(messageId, req.user.id);
  }

  // Get unread count
  @UseGuards(JwtAuthGuard)
  @Get('unread/count')
  async getUnreadCount(@Req() req: any) {
    return this.messageService.getUnreadCount(req.user.id);
  }

  // Get unread conversations
  @UseGuards(JwtAuthGuard)
  @Get('unread/conversations')
  async getUnreadConversations(@Req() req: any) {
    return this.messageService.getUnreadConversations(req.user.id);
  }
}
