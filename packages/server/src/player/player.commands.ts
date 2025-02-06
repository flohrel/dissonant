import { NecordLavalinkService, PlayerManager } from '@necord/lavalink';
import { Injectable, UseInterceptors } from '@nestjs/common';
import {
  blockQuote,
  EmbedBuilder,
  GuildMember,
  inlineCode,
  InteractionContextType,
  italic,
  quote,
  subtext,
  VoiceChannel,
} from 'discord.js';
import { Context, Options, SlashCommand, SlashCommandContext } from 'necord';
import { connected } from 'process';
import { Duration } from '../utils/time';
import { PlayDto, SkipDto, StopDto } from './player.dto';
import { SourceAutocompleteInterceptor } from './source.autocomplete';

@Injectable()
export class PlayerCommands {
  public constructor(
    private readonly playerManager: PlayerManager,
    private readonly lavalinkService: NecordLavalinkService,
  ) {}

  @UseInterceptors(SourceAutocompleteInterceptor)
  @SlashCommand({
    name: 'play',
    description: 'Play a track',
    contexts: [InteractionContextType.Guild],
  })
  public async onPlay(
    @Context() [interaction]: SlashCommandContext,
    @Options() { query, source }: PlayDto,
  ) {
    if (!interaction.guildId) return;

    const vcId = (interaction.member as GuildMember)?.voice?.channelId;
    if (!vcId)
      return interaction.reply({
        ephemeral: true,
        content: `You need to be in a voice channel`,
      });
    const vc = (interaction.member as GuildMember)?.voice
      ?.channel as VoiceChannel;
    if (!vc.joinable)
      return interaction.reply({
        ephemeral: true,
        content: "🔒 **I don't have permission to join your voice channel**",
      });
    if (!vc.speakable)
      return interaction.reply({
        ephemeral: true,
        content:
          "🔒 **I don't have permission to speak in your voice channel**",
      });

    const player =
      this.playerManager.get(interaction.guildId) ??
      this.playerManager.create({
        ...this.lavalinkService.extractInfoForPlayer(interaction),
        selfDeaf: true,
        selfMute: false,
        volume: 100,
      });

    player.connect();

    await interaction.deferReply();

    const response = await player.search(
      {
        query,
        source: source ?? 'spsearch',
      },
      interaction.user.id,
    );

    if (response.loadType === 'empty')
      return interaction.editReply({
        content: 'No tracks found',
      });

    if (response.loadType === 'error') {
      return interaction.editReply({
        content: 'Failed to load the track',
      });
    }

    response.tracks.forEach((track) => {
      track.userData = {
        requesterId: interaction.user.id,
      };
    });

    if (response.loadType === 'playlist') {
      player.queue.add(response.tracks);
      await interaction.editReply({
        content: `Playlist ${inlineCode(response.playlist?.title || '')} added by ${interaction.user.displayName} to queue`,
      });
    } else {
      player.queue.add(response.tracks[0]);
      await interaction.editReply({
        content: `Track ${inlineCode(response.tracks[0].info.author + ' - ' + response.tracks[0].info.title)} added by ${interaction.user.displayName} to queue`,
      });
    }

    if (!player.playing && !player.paused)
      player.play(connected ? { volume: 100, paused: false } : undefined);

    return;
  }

  @SlashCommand({
    name: 'stop',
    description: 'Stop player and clear queue',
    contexts: [InteractionContextType.Guild],
  })
  public async onStop(
    @Context() [interaction]: SlashCommandContext,
    @Options() { clearQueue }: StopDto,
  ) {
    if (!interaction.guildId) return;
    const vcId = (interaction.member as GuildMember)?.voice?.channelId;
    const player = this.playerManager.get(interaction.guildId);

    if (!player)
      return interaction.reply({
        ephemeral: true,
        content: 'No music is playing',
      });
    if (!vcId)
      return interaction.reply({
        ephemeral: true,
        content: 'Join a Voice Channel',
      });
    if (player.voiceChannelId !== vcId)
      return interaction.reply({
        ephemeral: true,
        content: 'You need to be in my Voice Channel',
      });

    await player.stopPlaying(clearQueue ?? true, false);

    return interaction.reply({ content: 'Stopped the player without leaving' });
  }

  @SlashCommand({
    name: 'skip',
    description: 'Skip current track',
    contexts: [InteractionContextType.Guild],
  })
  public async onSkip(
    @Context() [interaction]: SlashCommandContext,
    @Options() { skipTo }: SkipDto,
  ) {
    if (!interaction.guildId) return;
    const vcId = (interaction.member as GuildMember)?.voice?.channelId;
    const player = this.playerManager.get(interaction.guildId);

    if (!player)
      return interaction.reply({
        ephemeral: true,
        content: 'No music is playing',
      });
    if (!vcId)
      return interaction.reply({
        ephemeral: true,
        content: 'Join a Voice Channel',
      });
    if (player.voiceChannelId !== vcId)
      return interaction.reply({
        ephemeral: true,
        content: 'You need to be in my Voice Channel',
      });

    const current = player.queue.current;
    const nextTrack = player.queue.tracks[0];

    if (!nextTrack)
      return interaction.reply({
        ephemeral: true,
        content: `No Tracks to skip to`,
      });

    await player.skip(skipTo || 0);

    return interaction.reply({
      ephemeral: true,
      content: current
        ? `Skipped [\`${current?.info.title}\`](<${current?.info.uri}>) -> [\`${nextTrack?.info.title}\`](<${nextTrack?.info.uri}>)`
        : `Skipped to [\`${nextTrack?.info.title}\`](<${nextTrack?.info.uri}>)`,
    });
  }

  @SlashCommand({
    name: 'queue',
    description: 'View the queue',
    contexts: [InteractionContextType.Guild],
  })
  public async onQueue(@Context() [interaction]: SlashCommandContext) {
    if (!interaction.guildId) return;
    const vcId = (interaction.member as GuildMember)?.voice?.channelId;
    const player = this.playerManager.get(interaction.guildId);

    if (!player)
      return interaction.reply({
        ephemeral: true,
        content: 'No music is playing',
      });
    if (!vcId)
      return interaction.reply({
        ephemeral: true,
        content: 'Join a Voice Channel',
      });
    if (player.voiceChannelId !== vcId)
      return interaction.reply({
        ephemeral: true,
        content: 'You need to be in my Voice Channel',
      });

    const embed = new EmbedBuilder();

    embed
      .setAuthor({
        name: '🔊 Now playing',
      })
      .setTitle(
        (player.queue.current?.info.sourceName !== 'youtube'
          ? player.queue.current?.info.author!.toUpperCase() + ' - '
          : '') + player.queue.current?.info.title,
      )
      .setDescription(
        subtext(
          `${new Duration(player.queue.current?.info.duration).formatMMSS()}` +
            ' | ' +
            `requested by ${interaction.user.displayName}\n`,
        ),
      )
      .setThumbnail(player.queue.current?.info.artworkUrl || null)
      .setURL(player.queue.current?.info.uri || null)
      .addFields(
        player.queue.tracks.length === 0
          ? { name: '\u200b', value: italic('No tracks in queue') }
          : {
              name: '\u200b\nQueue',
              value:
                player.queue.tracks
                  .slice(0, player.queue.tracks.length > 5 ? 5 : undefined)
                  .map((track, _index) => {
                    return (
                      `* [${track.info.title.length > 40 ? track.info.title.slice(0, 50) + '...' : track.info.title}](${track.info.uri})\n` +
                      quote(
                        subtext(
                          `${new Duration(track?.info.duration).formatMMSS()} | requested by ${interaction.client.users.cache.get(track.userData?.requesterId as string)?.displayName}`,
                        ),
                      )
                    );
                  })
                  .join('\n') +
                (player.queue.tracks.length > 10
                  ? '\n...\n\u200b'
                  : '\n\u200b'),
            },
      )
      .addFields(
        player.queue.tracks.length !== 0
          ? [
              {
                name: 'Total duration',
                value: blockQuote(
                  new Duration(
                    player.queue.tracks.reduce((acc, track) => {
                      return acc + (track.info.duration || 0);
                    }, player.queue.current?.info.duration || 0),
                  ).formatHHMMSS(),
                ),
                inline: true,
              },
              {
                name: 'Track count',
                value: blockQuote(`${player.queue.tracks.length}`),
                inline: true,
              },
            ]
          : [],
      );

    return interaction.reply({
      embeds: [await embed],
    });
  }
}
