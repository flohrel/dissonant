import { Module } from '@nestjs/common';
import { PlayerCommands } from './player.command';
import { PlayerService } from './player.service';

@Module({
  providers: [PlayerService, PlayerCommands],
})
export class PlayerModule {}
