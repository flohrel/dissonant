import { Injectable } from '@nestjs/common';
import { AutocompleteInteraction } from 'discord.js';
import { AutocompleteInterceptor } from 'necord';

import { format_HHMMSS } from '@/common/utils/time';
import { PlayerService } from '@/player/player.service';

@Injectable()
export class SkipAutocomplete extends AutocompleteInterceptor {
  // private readonly logger = new Logger(PlayAutocompleteInterceptor.name);
  public constructor(private readonly playerService: PlayerService) {
    super();
  }

  public async transformOptions(interaction: AutocompleteInteraction) {
    const query = interaction.options.getFocused().trim();

    const response =
      await this.playerService.getPlayer(interaction).queue.tracks;

    return interaction.respond(
      response
        .map((track, index) => ({
          name:
            `[${index + 1}] ` +
            (track?.info.sourceName !== 'youtube'
              ? track.info.author + ' — '
              : '') +
            track.info.title.substring(0, 80) +
            ` • ${format_HHMMSS(track.info.duration)}`,
          value: `${index + 1}`,
        }))
        .filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 10),
    );
  }
}
