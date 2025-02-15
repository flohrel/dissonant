import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PlayerCommands } from './player.commands';
import { PlayerService } from './player.service';

@Module({
  imports: [HttpModule],
  providers: [PlayerCommands, PlayerService],
})
export class PlayerModule {}
