import { Injectable } from '@nestjs/common';
import { InteractionResponse } from 'discord.js';
import { Context, Options, SlashCommand, SlashCommandContext } from 'necord';
import { QueryDto } from './dto/query.dto';
import { SearchService } from './search.service';

@Injectable()
export class SearchCommands {
  constructor(private readonly searchService: SearchService) {}

  @SlashCommand({ name: 'search', description: 'Search a music track' })
  public async onSearch(
    @Context() [interaction]: SlashCommandContext,
    @Options() { text }: QueryDto,
  ): Promise<InteractionResponse<boolean>> {
    const { isUrl, type } = this.searchService.isUrl(text);
    if (!isUrl)
      return interaction.reply({
        content: await this.searchService.searchYoutube(text),
      });
    else if (type === undefined)
      return interaction.reply({ content: 'Unknown URL type' });
    else return interaction.reply({ content: type.toString() });
  }
}
