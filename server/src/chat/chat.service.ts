import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CallStatus, CallType, MessageType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const person = { id: true, username: true, fullName: true, profilePhoto: true } as const;

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private key(a: string, b: string) { return [a, b].sort().join(':'); }

  private normalizeQuery(query: string) {
    return query.trim().toLowerCase();
  }

  async friends(userId: string, query = '') {
    const links = await this.prisma.friendship.findMany({ where: { status: 'accepted', OR: [{ userId }, { friendId: userId }] }, include: { user: { select: person }, friend: { select: person } } });
    const needle = this.normalizeQuery(query);
    return links.map((link) => link.userId === userId ? link.friend : link.user).filter((user) => !needle || user.fullName.toLowerCase().includes(needle) || user.username.toLowerCase().includes(needle));
  }

  async assertMember(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
    if (!participant) throw new ForbiddenException('You are not a participant in this conversation.');
    return participant;
  }

  async openDirect(userId: string, otherUserId: string) {
    if (userId === otherUserId) throw new BadRequestException('You cannot message yourself.');
    const friend = await this.prisma.friendship.findFirst({ where: { status: 'accepted', OR: [{ userId, friendId: otherUserId }, { userId: otherUserId, friendId: userId }] } });
    if (!friend) throw new ForbiddenException('You can only start conversations with accepted friends.');
    const other = await this.prisma.user.findUnique({ where: { id: otherUserId }, select: person });
    if (!other) throw new NotFoundException('Friend not found.');
    const directKey = this.key(userId, otherUserId);
    return this.prisma.conversation.upsert({ where: { directKey }, create: { directKey, participants: { create: [{ userId }, { userId: otherUserId }] } }, update: {}, include: { participants: { include: { user: { select: person } } } } });
  }

  async list(userId: string) {
    const memberships = await this.prisma.conversationParticipant.findMany({ where: { userId, archivedAt: null }, include: { conversation: { include: { participants: { include: { user: { select: person } } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } } } }, orderBy: { conversation: { lastMessageAt: 'desc' } } });
    return memberships.map((item) => ({ ...item.conversation, unreadCount: 0, lastMessage: item.conversation.messages[0] ?? null }));
  }

  async detail(userId: string, conversationId: string, cursor?: string) {
    await this.assertMember(conversationId, userId);
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId }, include: { participants: { include: { user: { select: person } } } } });
    if (!conversation) throw new NotFoundException('Conversation not found.');
    const messages = await this.prisma.message.findMany({ where: { conversationId }, include: { sender: { select: person }, replyTo: { select: { id: true, content: true, senderId: true } } }, orderBy: { createdAt: 'desc' }, take: 51, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
    return { conversation, messages: messages.slice(0, 50).reverse(), nextCursor: messages.length > 50 ? messages[50].id : null };
  }

  async send(userId: string, input: { conversationId: string; content?: string; type?: MessageType; replyToMessageId?: string; clientId?: string; attachmentUrl?: string; attachmentName?: string; attachmentMimeType?: string }) {
    await this.assertMember(input.conversationId, userId);
    if (!input.content?.trim() && !input.attachmentUrl) throw new BadRequestException('A message needs text or an attachment.');
    if (input.clientId) { const saved = await this.prisma.message.findUnique({ where: { clientId: input.clientId }, include: { sender: { select: person } } }); if (saved) return saved; }
    const target = await this.prisma.conversationParticipant.findFirst({ where: { conversationId: input.conversationId, userId: { not: userId } } });
    if (!target) throw new BadRequestException('Direct conversation recipient is missing.');
    const message = await this.prisma.message.create({ data: { senderId: userId, receiverId: target.userId, conversationId: input.conversationId, content: input.content?.trim() ?? '', type: input.type ?? MessageType.TEXT, replyToMessageId: input.replyToMessageId, clientId: input.clientId, attachmentUrl: input.attachmentUrl, attachmentName: input.attachmentName, attachmentMimeType: input.attachmentMimeType }, include: { sender: { select: person }, replyTo: { select: { id: true, content: true, senderId: true } } } });
    await this.prisma.conversation.update({ where: { id: input.conversationId }, data: { lastMessageAt: message.createdAt } });
    return message;
  }

  async edit(userId: string, messageId: string, content: string) { const message = await this.prisma.message.findUnique({ where: { id: messageId } }); if (!message || message.senderId !== userId || message.type !== MessageType.TEXT) throw new ForbiddenException('Only your text messages can be edited.'); return this.prisma.message.update({ where: { id: messageId }, data: { content: content.trim(), editedAt: new Date() } }); }
  async remove(userId: string, messageId: string) { const message = await this.prisma.message.findUnique({ where: { id: messageId } }); if (!message || message.senderId !== userId) throw new ForbiddenException('Only your messages can be deleted.'); return this.prisma.message.update({ where: { id: messageId }, data: { content: '', deletedAt: new Date() } }); }
  async read(userId: string, conversationId: string) { await this.assertMember(conversationId, userId); const readAt = new Date(); await this.prisma.$transaction([this.prisma.conversationParticipant.update({ where: { conversationId_userId: { conversationId, userId } }, data: { lastReadAt: readAt } }), this.prisma.message.updateMany({ where: { conversationId, receiverId: userId, readAt: null }, data: { readAt } })]); return { conversationId }; }

  async startCall(userId: string, conversationId: string, type: CallType) { await this.assertMember(conversationId, userId); const recipient = await this.prisma.conversationParticipant.findFirst({ where: { conversationId, userId: { not: userId } } }); if (!recipient) throw new BadRequestException('Call recipient missing.'); return this.prisma.call.create({ data: { conversationId, callerId: userId, receiverId: recipient.userId, type }, include: { caller: { select: person } } }); }
  async callAction(userId: string, callId: string, status: CallStatus) { const call = await this.prisma.call.findUnique({ where: { id: callId } }); if (!call || (call.callerId !== userId && call.receiverId !== userId)) throw new ForbiddenException('You cannot change this call.'); const now = new Date(); const duration = call.answeredAt ? Math.floor((now.getTime() - call.answeredAt.getTime()) / 1000) : 0; const finalStatuses: CallStatus[] = [CallStatus.ENDED, CallStatus.REJECTED, CallStatus.CANCELLED, CallStatus.MISSED, CallStatus.FAILED]; return this.prisma.call.update({ where: { id: callId }, data: { status, answeredAt: status === CallStatus.ACCEPTED ? now : call.answeredAt, endedAt: finalStatuses.includes(status) ? now : null, duration } }); }
}
