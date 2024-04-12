import { Module } from '@nestjs/common';
import { PlayerService } from './player.service';

@Module({
  providers: [PlayerService, PlayerCommand],
})
export class PlayerModule {}
