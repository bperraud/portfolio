import { Controller, Post, UseGuards, Body, Get, Query } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { FriendDto } from 'src/friend/dto';
import { PrismaClient, Notif } from '@prisma/client';
import { NotificationService } from './notification.service';
import { ResponseDto } from './dto';
import { WebSocketService } from 'src/websocket/websocket.service';
import { FriendService } from 'src/friend/friend.service';
import { User } from '@prisma/client';

@UseGuards(JwtGuard)
@Controller('notification')
export class NotificationController {
  constructor(
    private prisma: PrismaClient,
    private notifService: NotificationService,
    private socketService: WebSocketService,
    private friendService: FriendService,
  ) {}

  @Post('add-friend')
  async addFriend(@GetUser() user, @Body() dto: FriendDto) {
    const prisma_friend = await this.prisma.user.findUnique({
      where: { username: dto.friend },
    });
    if (!prisma_friend) throw new NotFoundException('User not found');
    else if (user.id == prisma_friend.id)
      throw new ForbiddenException('You cannot add yourself as a friend');
    else if (await this.friendService.isFriendOf(user.id, prisma_friend.id)) {
      throw new ForbiddenException('You are already friends');
    }
    return await this.notifService.notifyEvent(
      prisma_friend.id,
      user.id,
      Notif['FRIEND'],
    );
  }

  @Post('friend-response')
  async responseFriend(@GetUser('id') id, @Body() dto: ResponseDto) {
    await this.notifService.removeNotification(
      id,
      dto.friendId,
      Notif['FRIEND'],
    );
    if (dto.response) {
      await this.friendService.addFriend(id, dto.friendId);
      return { message: 'accepted' };
    }
    return { message: 'declined' };
  }

  @Post('ask-game')
  async match(@GetUser() user, @Body() dto: FriendDto) {
    if (user.id == dto.friendId)
      throw new ForbiddenException('You cannot match yourself');
    const prisma_friend = await this.prisma.user.findUnique({
      where: { id: dto.friendId },
    });
    if (!prisma_friend) throw new NotFoundException('User not found');
    const socket = this.socketService.getSocket(prisma_friend.id);
    if (socket) socket.emit('game', { id: user.id, username: user.username });
  }

  @Get('get')
  async getNotification(@GetUser('id') id, @Query('type') type: string) {
    try {
      if (!Notif[type]) {
        throw new Error('Invalid notification type');
      }
      const notificationUser = await this.prisma.$queryRaw<
        User[]
      >`SELECT id, username FROM "public"."User" WHERE id IN (
		  SELECT "senderId" FROM "public"."Notification" WHERE "userId" = ${id}
		  AND "type" = ${type}::"Notif"
		)`;
      return notificationUser;
    } catch (error) {
      throw error;
    }
  }
}
