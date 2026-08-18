import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  // Send message
  async sendMessage(senderId: string, receiverId: string, content: string) {
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send message to yourself.');
    }

    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('Receiver not found.');
    }

    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
          },
        },
      },
    });

    return message;
  }

  // Get conversation between two users
  async getConversation(userId: string, otherUserId: string, limit: number = 50, offset: number = 0) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return messages;
  }

  // Get all conversations for a user
  async getConversations(userId: string, limit: number = 20, offset: number = 0) {
    // Get unique conversation partners
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
    });

    const conversationPartners = new Map<string, any>();

    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversationPartners.has(partnerId)) {
        const partner = await this.prisma.user.findUnique({
          where: { id: partnerId },
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
          },
        });

        if (partner) {
          conversationPartners.set(partnerId, {
            user: partner,
            lastMessage: msg,
          });
        }
      }
    }

    const conversations = Array.from(conversationPartners.values())
      .sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime())
      .slice(offset, offset + limit);

    return conversations;
  }

  // Mark message as read
  async markAsRead(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found.');
    }

    if (message.receiverId !== userId) {
      throw new BadRequestException('Cannot mark message as read if not the receiver.');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        readAt: new Date(),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
          },
        },
      },
    });

    return updated;
  }

  // Mark conversation as read
  async markConversationAsRead(userId: string, otherUserId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        readAt: null,
      },
    });

    for (const msg of messages) {
      await this.prisma.message.update({
        where: { id: msg.id },
        data: { readAt: new Date() },
      });
    }

    return { success: true, markedCount: messages.length };
  }

  // Delete message
  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found.');
    }

    if (message.senderId !== userId) {
      throw new BadRequestException('Cannot delete message you did not send.');
    }

    await this.prisma.message.delete({
      where: { id: messageId },
    });

    return { success: true };
  }

  // Get unread messages count
  async getUnreadCount(userId: string) {
    const unreadCount = await this.prisma.message.count({
      where: {
        receiverId: userId,
        readAt: null,
      },
    });

    return { unreadCount };
  }

  // Get unread conversations
  async getUnreadConversations(userId: string) {
    const unreadMessages = await this.prisma.message.findMany({
      where: {
        receiverId: userId,
        readAt: null,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const uniqueConversations = new Map<string, any>();

    for (const msg of unreadMessages) {
      if (!uniqueConversations.has(msg.senderId)) {
        uniqueConversations.set(msg.senderId, {
          sender: msg.sender,
          unreadCount: 0,
        });
      }
      uniqueConversations.get(msg.senderId).unreadCount++;
    }

    return Array.from(uniqueConversations.values());
  }
}
