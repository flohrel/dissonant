import { Module } from '@nestjs/common';
import { SearchCommands } from './search.command';
import { SearchService } from './search.service';

@Module({
  providers: [SearchService, SearchCommands],
})
export class SearchModule {}
