import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SocketGateway } from '../websocket/websocket.gateway';
import { ChatService } from './chat.service';
import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/user/user.service';
import { WebSocketService } from 'src/websocket/websocket.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
  },
})
export class ChatGateway extends SocketGateway {
  constructor(
    protected readonly chatService: ChatService,
    protected readonly webSocketService: WebSocketService,
    protected readonly authService: AuthService,
    protected readonly userService: UserService,
  ) {
    super(webSocketService, authService, userService);
  }

  async handleConnection(client: Socket) {
    return;
  }

  async handleDisconnect(client: Socket) {
    return;
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

  @SubscribeMessage('otherAddChat')
  async handleFriendAddChat(
    client: Socket,
    payload: { chat: any; userId: number },
  ) {
    const { chat, userId } = payload;
    const socket = await this.webSocketService.getSocket(userId);

    if (socket) {
      socket.join(`chat-${chat.id}`);
      socket.emit('addChat', chat);
      socket.emit('updateChat', chat.id);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    client: Socket,
    payload: { chatId: number; content: string; friendId?: number },
  ) {
    const chat = await this.chatService.findChatById(payload.chatId);
    const userId = this.webSocketService.getClientId(client);
    const user = await this.userService.getUserById(userId);

    const otherChatUser = chat
      ? chat.chatUsers.find((c) => (c as any).user.id !== userId)
      : null;
    const socket = this.webSocketService.getSocket(
      otherChatUser ? (otherChatUser as any).user.id : payload.friendId,
    );

    const sendMessage = async () => {
      const newMessage = await this.chatService.addMessageToDatabase(
        chat.id,
        payload.content,
        user.id,
      );
      this.chatService.updateLastMessageRead(chat.id, newMessage.id, user.id);
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

    if (
      chat.chatUsers &&
      !chat.chatUsers.find((c) => (c as any).user.id === user.id)
    ) {
      const chatUser = await this.chatService.addUserToChat(chat.id, user.id);
      const newchat = await this.chatService.findChatById(chat.id);
      client.join(`chat-${chat.id}`);
      this.server
        .to(`chat-${chat.id}`)
        .emit('chatUserAdded', { chatId: chat.id, chatUser });
      client.emit('addChat', newchat);
    }
    await sendMessage();
  }

  @SubscribeMessage('leaveGroup')
  async handleLeaveGroup(
    @MessageBody() data: { chatId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.webSocketService.getClientId(client);
    const isSuccessful = await this.chatService.leaveGroup(data.chatId, userId);

    if (isSuccessful) {
      client.emit('leaveChat', data.chatId);
      client.emit('updateGroupChat');
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
    const socket = await this.webSocketService.getSocket(userId);
    if (socket) socket.emit('userBan', { chatId, expiresAt });

    return;
  }

  @SubscribeMessage('unBanUser')
  async handleUnbanUser(
    client: Socket,
    payload: { chatId: number; userId: number },
  ) {
    const { chatId, userId } = payload;
    const socket = this.webSocketService.getSocket(userId);

    await this.chatService.unBanUser(chatId, userId);
    if (socket) socket.emit('userUnBan', { chatId });
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
    const socket = await this.webSocketService.getSocket(userId);
    if (socket) socket.emit('userMute', { chatId, expiresAt });

    return;
  }

  @SubscribeMessage('unMuteUser')
  async handleUnMuteUser(
    client: Socket,
    payload: { chatId: number; userId: number },
  ) {
    const { chatId, userId } = payload;
    const socket = this.webSocketService.getSocket(userId);

    await this.chatService.unMuteUser(chatId, userId);
    socket.emit('userUnMute', { chatId });
    return;
  }

  @SubscribeMessage('changeRole')
  async handleChangeRole(
    client: Socket,
    payload: { chatId: number; userId: number; newRoleId: number },
  ) {
    const { chatId, userId, newRoleId } = payload;
    await this.chatService.changeRole(chatId, userId, newRoleId);
    this.server.to(`chat-${chatId}`).emit('updateRole', {
      chatId: chatId,
      userId: userId,
      newRoleId: newRoleId,
    });
    return;
  }

  @SubscribeMessage('setAccess')
  async handleSetAccess(
    client: Socket,
    payload: { chatId: number; isProtected: boolean; password?: string },
  ) {
    const { chatId, isProtected, password } = payload;
    await this.chatService.setAccess(chatId, isProtected, password);
    return;
  }

  @SubscribeMessage('setPassword')
  async setPassword(
    client: any,
    payload: { chatId: number; password: string },
  ): Promise<void> {
    const { chatId, password } = payload;
    await this.chatService.setPassword(chatId, password);
  }
}