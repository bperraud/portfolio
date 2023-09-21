import {
  Controller,
  Post,
  Get,
  Query,
  Param,
  Body,
  Patch,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtGuard } from '../auth/guard';
import { UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorator';

@UseGuards(JwtGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':friendId')
  async getConversation(
    @GetUser('id') id,
    @Param('friendId') friendId: string,
  ) {
    return await this.chatService.getConversation(id, Number(friendId));
  }

  @Get('allUserChats')
  async getAllUserChats(@GetUser() user) {
    const chats = await this.chatService.getAllUserChats(user.username);
    return chats;
  }

  @Get('publicChats')
  async getPublicChats(
    @Query('start') start: string,
    @Query('limit') limit: string,
  ) {
    const { chats, totalChatsCount } = await this.chatService.getChatsPublic(
      Number(start),
      Number(limit),
    );
    return { chats, totalChatsCount };
  }

  @Get(':chatId')
  async findChatById(@Param('chatId') chatId: string) {
    const chat = await this.chatService.findChatById(Number(chatId));
    return chat;
  }

  @Post('verifyPassword')
  async verifyPassword(@Body() body: { chatId: string; password: string }) {
    const chat = await this.chatService.findChatById(Number(body.chatId));
    if (chat.accessibility === 'public' || chat.accessibility === 'private')
      return true;
    if (
      chat.accessibility === 'protected' &&
      chat.password &&
      chat.password === body.password
    )
      return true;
    else return false;
  }

  @Post('create-chat')
  async createChat(
    @Body('groupName') groupName: string,
    @Body('memberUsernames') memberUsernames: string[],
    @Body('accessibility') accessibility: string,
    @Body('password') password?: string,
  ) {
    const newGroupChat = await this.chatService.createChat(
      groupName,
      memberUsernames,
      accessibility,
      password,
    );

    return newGroupChat;
  }

  @Patch('updateLastMessageRead')
  async updateLastMessageRead(@Body() body): Promise<any> {
    const { chatId, messageId, userId } = body;
    return await this.chatService.updateLastMessageRead(
      chatId,
      messageId,
      userId,
    );
  }
}
