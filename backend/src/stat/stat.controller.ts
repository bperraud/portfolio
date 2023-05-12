import { Controller, Patch, Body } from '@nestjs/common';
import { JwtGuard } from '../auth/guard';
import { UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorator';
import { StatService } from './stat.service';
import { UpdateStatDto } from './dto';

@UseGuards(JwtGuard)
@Controller('stat')
export class StatController {
  constructor(private statService: StatService) {}

  @Patch('update-stats')
  updateStats(@GetUser('id') userId: number, @Body() dto: UpdateStatDto) {
    return this.statService.updateStat(userId, dto);
  }
}
