import {
  Injectable,
  UploadedFile,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EditUserDto } from './dto';
import { WebSocketService } from '../websocket/websocket.service';
import { createWriteStream } from 'fs';
import { HttpService } from '@nestjs/axios';
import UPLOAD_PATH from '../../config/upload-path';
import * as fs from 'fs';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private socketService: WebSocketService,
  ) {}

  async getUserById(userId: number) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async editUser(userId: number, dto: EditUserDto) {
    try {
      const user = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          ...dto,
        },
      });
      delete user.hash;
      return user;
    } catch (error) {
      if (error.code === 'P2002')
        throw new ForbiddenException('Credentials taken');
      else
        throw new ForbiddenException(
          'Login and Username cannot exceed 25 chars',
        );
    }
  }

  async getUserStatus(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      return this.socketService.getStatus(user.id);
    } catch (error) {
      throw new NotFoundException(`User with login '${userId}' not found.`);
    }
  }

  async saveImageFromUrl(url: string, fileName: string): Promise<string> {
    const fileNamePath = fileName + '.png';
    const writer = createWriteStream(UPLOAD_PATH + fileNamePath);
    const response = await this.httpService.axiosRef({
      url: url,
      method: 'GET',
      responseType: 'stream',
    });
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        resolve(fileNamePath);
      });
      writer.on('error', (error) => {
        console.error(`Error downloading image from ${url}:`, error);
        reject(`Failed to download image from ${url}`);
      });
    });
  }

  async saveImageFromBuffer(
    @UploadedFile() file: Express.Multer.File,
    fileName: string,
  ) {
    const fileNamePath = fileName;
    await fs.promises.writeFile(UPLOAD_PATH + fileNamePath, file.buffer);

    return {
      message: 'File uploaded successfully',
      file: {
        originalName: file.originalname,
        size: file.size,
        fileName: fileNamePath,
      },
    };
  }

  getStatus(userId: number) {
    return this.socketService.getStatus(userId);
  }

  async getUserBlocks(username: string) {
    //const user = await this.prisma.user.findUnique({
    //  where: { username: username },
    //  include: { blocks: true },
    //});
    //return user.blocks;
  }

  async blockUser(userId: number, blockedId: number) {
    //const existingBlock = await this.prisma.block.findFirst({
    //  where: {
    //    blockerId: userId,
    //    blockedId: blockedId,
    //  },
    //});
    //if (existingBlock) return false;
    //return this.prisma.block.create({
    //  data: {
    //    blockerId: userId,
    //    blockedId: blockedId,
    //  },
    //});
  }

  async unblockUser(userId: number, blockedId: number) {
    //const existingBlock = await this.prisma.block.findFirst({
    //  where: {
    //    blockerId: userId,
    //    blockedId: blockedId,
    //  },
    //});
    //if (!existingBlock) return false;
    //return this.prisma.block.delete({
    //  where: { id: existingBlock.id },
    //});
  }
}
