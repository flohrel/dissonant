import { PlayerManager } from '@necord/lavalink';
import { Injectable } from '@nestjs/common';
import { AutocompleteInteraction, GuildMember, VoiceChannel } from 'discord.js';
import { AutocompleteInterceptor } from 'necord';
import { format_HHMMSS } from '../utils/time';

@Injectable()
export class QueryAutocompleteInterceptor extends AutocompleteInterceptor {
  public constructor(private readonly playerManager: PlayerManager) {
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

    const player =
      this.playerManager.get(interaction.guildId) ??
      this.playerManager.create({
        guildId: interaction.guildId,
        textChannelId: interaction.channelId,
        voiceChannelId: vcId,
        selfDeaf: true,
        selfMute: false,
        volume: 100,
      });

    if (!player.connected) await player.connect();

    const res = await player.search({ query }, interaction.user.id);

    if (!res.tracks.length) {
      return await interaction.respond([
        { name: 'No Tracks found', value: 'nothing_found' },
      ]);
    }

    await interaction.respond(
      res.loadType === 'playlist'
        ? [
            {
              name: `Playlist ${res.playlist?.title} [${res.tracks.length} tracks]`,
              value: `${query}`,
            },
          ]
        : res.tracks
            .map((track, _index) => ({
              name:
                (track?.info.sourceName !== 'youtube'
                  ? track.info.author?.toUpperCase() + ' - '
                  : '') +
                track.info.title.substring(0, 80) +
                ` | ${format_HHMMSS(track.info.duration)}`,
              value: `${track.info.isrc || track.info.uri}`,
            }))
            .slice(0, 5),
    );
  }
}
