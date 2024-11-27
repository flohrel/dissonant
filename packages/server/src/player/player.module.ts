import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { SearchModule } from '../search/search.module';
import { PlayerCommands } from './player.command';
import { PlayerService } from './player.service';

@Module({
  imports: [HttpModule, SearchModule],
  providers: [PlayerService, PlayerCommands],
})
export class PlayerModule {}
