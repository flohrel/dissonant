import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PlayerCommands } from './player.command';

@Module({
  imports: [HttpModule],
  providers: [PlayerCommands],
})
export class PlayerModule {}
