import { Injectable } from '@nestjs/common';
import { AutocompleteInteraction } from 'discord.js';
import { AutocompleteInterceptor } from 'necord';

import { format_HHMMSS } from '@/common/utils/time';
import { PlayerService } from '@/player/player.service';

export interface PlayAutocompletePayload {
  query: string;
  selectedIndex?: number;
}

@Injectable()
export class PlayAutocomplete extends AutocompleteInterceptor {
  public constructor(private readonly playerService: PlayerService) {
    super();
  }

  public async transformOptions(interaction: AutocompleteInteraction) {
    const query = interaction.options.getFocused();

    if (!query.trim()) return;

    const response = await this.playerService.search(interaction, query);

    switch (response.loadType) {
      case 'empty':
        return interaction.respond([
          {
            name: '⚠️ No tracks found',
            value: JSON.stringify({ query, selectedIndex: undefined }),
          },
        ]);
      case 'error':
        return interaction.respond([
          {
            name: `⚠️ Failed to load: ${response.exception?.message}`,
            value: JSON.stringify({ query, selectedIndex: undefined }),
          },
        ]);
      case 'playlist':
        return interaction.respond([
          {
            name: `Playlist ${response.playlist?.title} [${response.tracks.length} tracks]`,
            value: JSON.stringify({ query, selectedIndex: undefined }),
          },
        ]);
      case 'track':
        const track = response.tracks[0];
        return interaction.respond([
          {
            name:
              (track?.info.sourceName !== 'youtube'
                ? track.info.author + ' — '
                : '') +
              track.info.title.substring(0, 80) +
              ` • ${format_HHMMSS(track.info.duration)}`,
            value: JSON.stringify({ query, selectedIndex: 0 }),
          },
        ]);
      case 'search':
        return interaction.respond(
          response.tracks
            .map((track, index) => ({
              name:
                (track?.info.sourceName !== 'youtube'
                  ? track.info.author + ' — '
                  : '') +
                track.info.title.substring(0, 80) +
                ` • ${format_HHMMSS(track.info.duration)}`,
              value: JSON.stringify({ query, selectedIndex: index }),
            }))
            .slice(0, 10),
        );
      default:
        return;
    }
  }
}
