import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { WebSocketService } from './websocket.service';
import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/user/user.service';
import { ChatService } from 'src/chat/chat.service';
import { StatService } from 'src/stat/stat.service';
import { NotificationService } from 'src/notification/notification.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
  },
})
export abstract class SocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    protected readonly webSocketService: WebSocketService,
    protected readonly authService: AuthService,
    protected readonly userService: UserService,
    protected readonly chatService: ChatService,
    protected readonly statService: StatService,
    protected readonly notificationService: NotificationService,
  ) {}

  async handleConnection(client: Socket) {
    const token = Array.isArray(client.handshake.query.token)
      ? client.handshake.query.token[0]
      : client.handshake.query.token;

    const user = await this.authService.validateToken(token);

    if (!user) {
      client.disconnect();
      return;
    }
    console.log(`${user.username} connected`);
    this.webSocketService.addSocket(user.username, client);
    this.userService.updateUserStatus(user.username, 'online');
    const userToNotify = await this.notificationService.removeNotification(
      user.username,
      'game',
    );
    for (const id of userToNotify) {
      const user = await this.userService.getUserById(id);
      this.webSocketService
        .getSocket(user.username)
        .emit('game', user.username);
    }
  }

  handleDisconnect(client: Socket) {
    const username = this.webSocketService.getClientName(client);
    if (username) this.userService.updateUserStatus(username, 'offline');
    console.log(`${username} disconnected`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, payload: { chatId: number }) {
    client.join(`chat-${payload.chatId}`);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveChatRoom(client: Socket, payload: { chatId: number }) {
    client.leave(`chat-${payload.chatId}`);
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(client: any, payload: any) {
    const chatId = payload.chatId;

    const chat = await this.chatService.findChatById(chatId);

    client.join(`chat-${payload.chatId}`);
    client.emit('addChat', chat);
  }

  @SubscribeMessage('createGroupChat')
  async handleCreateChat(
    client: Socket,
    payload: {
      groupName: string;
      memberUsernames: string[];
      isGroupChat: boolean;
      accessibility: string;
      password?: string;
    },
  ) {
    const newGroupChat = await this.chatService.createChat(
      payload.groupName,
      payload.memberUsernames,
      payload.isGroupChat,
      payload.accessibility,
      payload.password,
    );

    for (const member of newGroupChat.chatUsers) {
      const memberSocket = this.webSocketService.getSocket(
        (member as any).user.username,
      );
      if (memberSocket) memberSocket.join(`chat-${newGroupChat.id}`);
    }
    this.server.to(`chat-${newGroupChat.id}`).emit('addChat', newGroupChat);
    client.emit('createChat', newGroupChat.id);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    client: Socket,
    payload: { chatId: number; content: string; friendUsername?: string },
  ) {
    const chat = await this.chatService.findChatById(payload.chatId);
    const username = this.webSocketService.getClientName(client);
    const user = await this.userService.getUser(username);

    const otherChatUser = chat
      ? chat.chatUsers.find((c) => (c as any).user.username !== username)
      : null;
    const socket = this.webSocketService.getSocket(
      otherChatUser
        ? (otherChatUser as any).user.username
        : payload.friendUsername,
    );

    const sendMessage = async () => {
      const newMessage = await this.chatService.addMessageToDatabase(
        chat.id,
        payload.content,
        user.id,
      );
      if (chat.isGroupChat) {
        this.server
          .to(`chat-${payload.chatId}`)
          .emit('message', { chatId: chat.id, message: newMessage });
      } else {
        client.emit('message', { chatId: chat.id, message: newMessage });
        if (socket)
          socket.emit('message', { chatId: chat.id, message: newMessage });
      }
    };

    if (!chat) {
      const newchat = await this.chatService.createChat(
        `${username}-${payload.friendUsername}`,
        [username, payload.friendUsername],
        false,
        'private',
      );
      const newMessage = await this.chatService.addMessageToDatabase(
        newchat.id,
        payload.content,
        user.id,
      );
      newchat.messages.push(newMessage);
      if (socket) {
        socket.emit('addChat', newchat);
        socket.emit('updateChat', newchat.id);
      }
      client.emit('addChat', newchat);
      client.emit('updateChat', newchat.id);
    } else {
      if (!chat.chatUsers.find((c) => (c as any).user.id === user.id)) {
        await this.chatService.addUserToChat(chat.id, user.id);
        const newchat = await this.chatService.findChatById(chat.id);

        client.join(`chat-${chat.id}`);
        client.emit('addChat', newchat);
      }
      await sendMessage();
    }
  }

  @SubscribeMessage('leaveGroup')
  async handleLeaveGroup(
    @MessageBody() data: { chatId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.webSocketService.getClientName(client);
    const userId = (await this.userService.getUser(user)).id;
    const isSuccessful = await this.chatService.leaveGroup(data.chatId, userId);

    if (isSuccessful) {
      client.emit('leaveChat', data.chatId);
      client.leave(`chat-${data.chatId}`);
    }
  }

  @SubscribeMessage('changeChatName')
  async handleChangeChatName(
    @MessageBody() data: { chatId: number; newName: string },
    @ConnectedSocket() client: Socket,
  ) {
    const isSuccessful = await this.chatService.changeChatName(
      data.chatId,
      data.newName,
    );
    if (isSuccessful && isSuccessful.isGroupChat) {
      this.server
        .to(`chat-${data.chatId}`)
        .emit('updateChatName', { chatId: data.chatId, newName: data.newName });
    }
  }

  //BAN//

  @SubscribeMessage('banUser')
  async handleBanUser(
    client: Socket,
    payload: { chatId: number; userId: number; duration: number | null },
  ) {
    const { chatId, userId, duration } = payload;
    const expiresAt = await this.chatService.banUser(chatId, userId, duration);

    const user = await this.userService.getUserById(userId);
    const socket = await this.webSocketService.getSocket(user.username);

    if (socket) socket.emit('userBan', { chatId, expiresAt });

    return;
  }

  @SubscribeMessage('unBanUser')
  async handleUnbanUser(
    client: Socket,
    payload: { chatId: number; userId: number },
  ) {
    const { chatId, userId } = payload;
    await this.chatService.unBanUser(chatId, userId);
    return;
  }

  //MUTE//

  @SubscribeMessage('muteUser')
  async handleMuteUser(
    client: Socket,
    payload: { chatId: number; userId: number; duration: number | null },
  ) {
    const { chatId, userId, duration } = payload;
    const expiresAt = await this.chatService.muteUser(chatId, userId, duration);
    const user = await this.userService.getUserById(userId);
    const socket = await this.webSocketService.getSocket(user.username);
    if (socket) socket.emit('userMute', { chatId, expiresAt });

    return;
  }

  @SubscribeMessage('unMuteUser')
  async handleUnMuteUser(
    client: Socket,
    payload: { chatId: number; userId: number },
  ) {
    const { chatId, userId } = payload;
    await this.chatService.unMuteUser(chatId, userId);
    return;
  }

  @SubscribeMessage('response-friend')
  async handleAcceptFriend(
    @MessageBody() data: { response: boolean; friend: string },
    @ConnectedSocket() client: Socket,
  ) {
    const username = this.webSocketService.getClientName(client);
    const user = await this.userService.getUser(data.friend);
    if (!user) return { error: 'User not found' };
    if (data.response) {
      this.userService.addFriend(username, user.id);
    }
    client.emit('friend-accepted', data.friend);
  }

  @SubscribeMessage('response-game')
  async handleMatch(
    @MessageBody() data: { response: boolean; friend: string },
    @ConnectedSocket() client: Socket,
  ) {
    const username = this.webSocketService.getClientName(client);
    if (data.response) {
      this.webSocketService.createRoom(username, data.friend);
    }
  }
}
