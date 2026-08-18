import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

@WebSocketGateway(4001, {
  cors: {
    origin: ['http://localhost:3002', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socket IDs

  constructor(
    private readonly jwt: JwtService,
    private readonly chat: ChatService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Socket.IO server initialized on port 4001');
  }

  async handleConnection(socket: AuthenticatedSocket) {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        this.logger.warn('Connection attempt without token');
        socket.disconnect();
        return;
      }

      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: process.env.JWT_SECRET ?? 'dev-secret',
      });

      // Fetch user to get username
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, username: true },
      });

      if (!user) {
        this.logger.warn(`Connection attempt with invalid user: ${payload.sub}`);
        socket.disconnect();
        return;
      }

      socket.userId = user.id;
      socket.username = user.username;

      // Track user sockets
      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id)!.add(socket.id);

      // Join user-specific room
      socket.join(`user:${user.id}`);

      // Broadcast online status
      this.server.emit('presence:update', {
        userId: user.id,
        username: user.username,
        online: true,
        timestamp: new Date(),
      });

      this.logger.log(`User ${user.username} (${user.id}) connected`);
    } catch (error) {
      this.logger.error('Error during connection:', error);
      socket.disconnect();
    }
  }

  handleDisconnect(socket: AuthenticatedSocket) {
    try {
      if (!socket.userId) {
        return;
      }

      const userSockets = this.userSockets.get(socket.userId);
      if (userSockets) {
        userSockets.delete(socket.id);

        // If user has no more active connections, broadcast offline
        if (userSockets.size === 0) {
          this.userSockets.delete(socket.userId);
          this.server.emit('presence:update', {
            userId: socket.userId,
            online: false,
            timestamp: new Date(),
          });
        }
      }

      this.logger.log(`User ${socket.username} (${socket.userId}) disconnected`);
    } catch (error) {
      this.logger.error('Error during disconnection:', error);
    }
  }

  @SubscribeMessage('conversation:join')
  async join(@ConnectedSocket() socket: AuthenticatedSocket, @MessageBody() body: { conversationId: string }) {
    try {
      if (!socket.userId) throw new Error('Unauthorized');
      await this.chat.assertMember(body.conversationId, socket.userId);
      socket.join(`conversation:${body.conversationId}`);
      this.logger.log(`${socket.username} joined conversation ${body.conversationId}`);
    } catch (error) {
      this.logger.error('Error joining conversation:', error);
      socket.emit('conversation:error', { error: error.message });
    }
  }

  @SubscribeMessage('conversation:leave')
  async leave(@ConnectedSocket() socket: AuthenticatedSocket, @MessageBody() body: { conversationId: string }) {
    try {
      socket.leave(`conversation:${body.conversationId}`);
      this.logger.log(`${socket.username} left conversation ${body.conversationId}`);
    } catch (error) {
      this.logger.error('Error leaving conversation:', error);
      socket.emit('conversation:error', { error: error.message });
    }
  }

  @SubscribeMessage('message:send')
  async send(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() body: any,
  ) {
    try {
      if (!socket.userId) throw new Error('Unauthorized');
      const message = await this.chat.send(socket.userId, body);
      this.server.to(`conversation:${message.conversationId}`).emit('message:new', message);
      this.server.to(`user:${message.receiverId}`).emit('message:new', message);
      return message;
    } catch (error) {
      this.logger.error('Error sending message:', error);
      socket.emit('message:error', { error: error.message });
    }
  }

  @SubscribeMessage('typing')
  async typing(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() body: { conversationId: string; typing: boolean },
  ) {
    try {
      if (!socket.userId) throw new Error('Unauthorized');
      await this.chat.assertMember(body.conversationId, socket.userId);
      socket.to(`conversation:${body.conversationId}`).emit('typing', {
        conversationId: body.conversationId,
        userId: socket.userId,
        username: socket.username,
        typing: body.typing,
      });
    } catch (error) {
      this.logger.error('Error sending typing indicator:', error);
    }
  }

  @SubscribeMessage('message:read')
  async read(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() body: { conversationId: string; messageIds: string[] },
  ) {
    try {
      if (!Array.isArray(body.messageIds)) {
        return;
      }

      await this.prisma.message.updateMany({
        where: {
          id: { in: body.messageIds },
          conversationId: body.conversationId,
        },
        data: {
          readAt: new Date(),
        },
      });

      this.server.to(`conversation:${body.conversationId}`).emit('message:read', {
        userId: socket.userId,
        messageIds: body.messageIds,
        readAt: new Date(),
      });
    } catch (error) {
      this.logger.error('Error processing read receipt:', error);
    }
  }

  @SubscribeMessage('webrtc:signal')
  async signal(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() body: { callId: string; targetUserId: string; type: string; payload?: unknown },
  ) {
    this.server.to(`user:${body.targetUserId}`).emit('webrtc:signal', {
      callId: body.callId,
      fromUserId: socket.userId,
      type: body.type,
      payload: body.payload,
    });
  }

  @SubscribeMessage('call:notify')
  notify(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() body: { targetUserId: string; callType?: string; conversationId?: string },
  ) {
    this.server.to(`user:${body.targetUserId}`).emit('call:incoming', {
      fromUserId: socket.userId,
      fromUsername: socket.username,
      callType: body.callType,
      conversationId: body.conversationId,
    });
  }

  /**
   * Send notification to specific user
   */
  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }

  /**
   * Broadcast notification to multiple users
   */
  broadcastNotification(userIds: string[], notification: any) {
    userIds.forEach((userId) => {
      this.server.to(`user:${userId}`).emit('notification:new', notification);
    });
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.size > 0;
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }
}
