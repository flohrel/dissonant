import { Injectable } from '@nestjs/common';
import { AutocompleteInteraction, GuildMember, VoiceChannel } from 'discord.js';
import { AutocompleteInterceptor } from 'necord';
import { format_HHMMSS } from '../utils/time';
import { PlayerService } from './player.service';

@Injectable()
export class QueryAutocompleteInterceptor extends AutocompleteInterceptor {
  public constructor(private readonly playerService: PlayerService) {
    super();
  }

  public async transformOptions(interaction: AutocompleteInteraction) {
    if (!interaction.guildId) return;

    const vcId = (interaction.member as GuildMember)?.voice?.channelId;
    if (!vcId)
      return interaction.respond([
        {
          name: '❌ You need to be in a voice channel',
          value: 'no_vc',
        },
      ]);
    const vc = (interaction.member as GuildMember)?.voice
      ?.channel as VoiceChannel;
    if (!vc.joinable)
      return interaction.respond([
        {
          name: "❌ I don't have permission to join your voice channel",
          value: 'no_join_permission',
        },
      ]);
    if (!vc.speakable)
      return interaction.respond([
        {
          name: "❌ I don't have permission to speak in your voice channel",
          value: 'no_speak_permission',
        },
      ]);

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
                ? track.info.author?.toUpperCase() + ' - '
                : '') +
              track.info.title.substring(0, 80) +
              ` | ${format_HHMMSS(track.info.duration)}`,
            value: JSON.stringify({ query, selectedIndex: 0 }),
          },
        ]);
      case 'search':
        return interaction.respond(
          response.tracks
            .map((track, index) => ({
              name:
                (track?.info.sourceName !== 'youtube'
                  ? track.info.author?.toUpperCase() + ' - '
                  : '') +
                track.info.title.substring(0, 80) +
                ` | ${format_HHMMSS(track.info.duration)}`,
              value: JSON.stringify({ query, selectedIndex: index }),
            }))
            .slice(0, 5),
        );
      default:
        return;
    }
  }
}
