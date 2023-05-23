import { Module } from '@nestjs/common';
import { MatchmakingController } from './matchmaking.controller';
import { MatchmakingService } from './matchmaking.service';
import { UserService } from 'src/user/user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { WebSocketModule } from 'src/websocket/websocket.module';

@Module({
  imports: [JwtModule.register({}), HttpModule, WebSocketModule],
  controllers: [MatchmakingController],
  providers: [MatchmakingService, UserService, PrismaService],
})
export class MatchmakingModule {}
