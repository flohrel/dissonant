import { GlobalDiscordFilter } from '@/common/exceptions/exceptions.filter';
import { PlayCommand } from '@/player/commands/play.command';
import { QueueCommand } from '@/player/commands/queue.command';
import { SkipCommand } from '@/player/commands/skip.command';
import { StopCommand } from '@/player/commands/stop.command';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { PlayerService } from './player.service';

@Module({
  imports: [HttpModule],
  providers: [
    PlayCommand,
    SkipCommand,
    StopCommand,
    QueueCommand,
    PlayerService,
    {
      provide: APP_FILTER,
      useClass: GlobalDiscordFilter,
    },
  ],
  exports: [PlayerService],
})
export class PlayerModule {}
