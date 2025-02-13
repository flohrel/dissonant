import { NecordLavalinkService, PlayerManager } from '@necord/lavalink';
import { Injectable, UseInterceptors } from '@nestjs/common';
import {
  blockQuote,
  EmbedBuilder,
  GuildMember,
  inlineCode,
  InteractionContextType,
  MessageFlags,
  quote,
  subtext,
  VoiceChannel,
} from 'discord.js';
import { Context, Options, SlashCommand, SlashCommandContext } from 'necord';
import { connected } from 'process';
import { format_HHMMSS } from '../utils/time';
import { PlayDto, SkipDto, StopDto } from './player.dto';
import { QueryAutocompleteInterceptor } from './query.interceptor';

@Injectable()
export class PlayerCommands {
  public constructor(
    private readonly playerManager: PlayerManager,
    private readonly lavalinkService: NecordLavalinkService,
  ) {}

  @UseInterceptors(QueryAutocompleteInterceptor)
  @SlashCommand({
    name: 'play',
    description: 'Play a track',
    contexts: [InteractionContextType.Guild],
  })
  public async onPlay(
    @Context() [interaction]: SlashCommandContext,
    @Options() { query }: PlayDto,
  ) {
    if (!interaction.guildId) return;

    const vcId = (interaction.member as GuildMember)?.voice?.channelId;
    if (!vcId)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: '⚠️ **You need to be in a voice channel** 🔊',
      });
    const vc = (interaction.member as GuildMember)?.voice
      ?.channel as VoiceChannel;
    if (!vc.joinable)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "⚠️ **I don't have permission to join your voice channel** 🔒",
      });
    if (!vc.speakable)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content:
          "⚠️ **I don't have permission to speak in your voice channel** 🔒",
      });

    const player =
      this.playerManager.get(interaction.guildId) ??
      this.playerManager.create({
        ...this.lavalinkService.extractInfoForPlayer(interaction),
        selfDeaf: true,
        selfMute: false,
        volume: 100,
      });

    if (!player.connected) await player.connect();

    await interaction.deferReply();

    const response = await player.search({ query }, interaction.user.id);

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
        id: interaction.user.id,
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
        content: `Track ${response.tracks[0].info.sourceName !== 'youtube' ? inlineCode(response.tracks[0].info.author + ' - ' + response.tracks[0].info.title) : inlineCode(response.tracks[0].info.title)} added by ${interaction.user.displayName} to queue`,
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
        flags: MessageFlags.Ephemeral,
        content: '⚠️ **No music is playing**',
      });
    if (!vcId)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: '⚠️ **You need to be in a Voice Channel**',
      });
    if (player.voiceChannelId !== vcId)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: '⚠️ **You need to be in my Voice Channel**',
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
        flags: MessageFlags.Ephemeral,
        content: '⚠️ **No music is playing**',
      });
    if (!vcId)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: '⚠️ **Join need to be in a Voice Channel**',
      });
    if (player.voiceChannelId !== vcId)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: '⚠️ **You need to be in my Voice Channel**',
      });

    const current = player.queue.current;
    const nextTrack = player.queue.tracks[0];

    if (!nextTrack)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: `No Tracks to skip to`,
      });

    await player.skip(skipTo || 0);

    return interaction.reply({
      flags: MessageFlags.Ephemeral,
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
        flags: MessageFlags.Ephemeral,
        content: '⚠️ `No music is playing`',
      });
    if (!vcId)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: '⚠️ `You need to be in a voice channel`',
      });
    if (player.voiceChannelId !== vcId)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: '⚠️ `You need to be in my Voice Channel`',
      });

    const currentTrackInfo = player.queue.current?.info;
    const trackList = player.queue.tracks;

    if (trackList.length === 0)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: '`The queue is empty`',
      });

    const embed = new EmbedBuilder();
    embed
      .setTitle('Next in queue')
      .setDescription(
        trackList
          .slice(0, trackList.length > 10 ? 10 : undefined)
          .map((track, index) => {
            const trackInfo = track.info;
            const icon = [
              '1️⃣',
              '2️⃣',
              '3️⃣',
              '4️⃣',
              '5️⃣',
              '6️⃣',
              '7️⃣',
              '8️⃣',
              '9️⃣',
              '🔟',
            ];
            return (
              `* ${icon[index]} [${trackInfo.title.length > 40 ? trackInfo.title.slice(0, 50) + '...' : trackInfo.title}](${trackInfo.uri})\n` +
              quote(
                subtext(
                  `${format_HHMMSS(trackInfo.duration)} | requested by ${interaction.client.users.cache.get(track.userData?.id as string)?.displayName}`,
                ),
              )
            );
          })
          .join('\n') + (trackList.length > 10 ? '\n...' : ''),
      )
      .addFields(
        trackList.length !== 0
          ? [
              {
                name: 'Total duration',
                value: blockQuote(
                  format_HHMMSS(
                    trackList.reduce((acc, track) => {
                      return acc + (track.info.duration || 0);
                    }, currentTrackInfo?.duration || 0),
                  ),
                ),
                inline: true,
              },
              {
                name: 'Track count',
                value: blockQuote(`${trackList.length + 1}`),
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
