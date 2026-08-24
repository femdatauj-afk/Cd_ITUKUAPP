import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CallStatus, CallType, MessageType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}
  @Get('friends') friends(@Req() req: any, @Query('q') q?: string) {
    return this.chat.friends(req.user.id, q);
  }
  @Get('conversations') list(@Req() req: any) {
    return this.chat.list(req.user.id);
  }
  @Post('conversations/direct/:userId') direct(
    @Req() req: any,
    @Param('userId') userId: string,
  ) {
    return this.chat.openDirect(req.user.id, userId);
  }
  @Get('conversations/:id') detail(
    @Req() req: any,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.chat.detail(req.user.id, id, cursor);
  }
  @Post('messages') send(
    @Req() req: any,
    @Body()
    body: {
      conversationId: string;
      content?: string;
      type?: MessageType;
      replyToMessageId?: string;
      clientId?: string;
      attachmentUrl?: string;
      attachmentName?: string;
      attachmentMimeType?: string;
    },
  ) {
    return this.chat.send(req.user.id, body);
  }
  @Put('messages/:id') edit(
    @Req() req: any,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.chat.edit(req.user.id, id, content);
  }
  @Delete('messages/:id') remove(@Req() req: any, @Param('id') id: string) {
    return this.chat.remove(req.user.id, id);
  }
  @Post('conversations/:id/read') read(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.chat.read(req.user.id, id);
  }
  @Post('calls') start(
    @Req() req: any,
    @Body() body: { conversationId: string; type: CallType },
  ) {
    return this.chat.startCall(req.user.id, body.conversationId, body.type);
  }
  @Post('calls/:id/:action') action(
    @Req() req: any,
    @Param('id') id: string,
    @Param('action') action: CallStatus,
  ) {
    return this.chat.callAction(req.user.id, id, action);
  }
}
