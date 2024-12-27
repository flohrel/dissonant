import { NecordLavalinkService, PlayerManager } from '@necord/lavalink';
import { Injectable } from '@nestjs/common';
import { GuildMember, InteractionContextType, VoiceChannel } from 'discord.js';
import { Context, Options, SlashCommand, SlashCommandContext } from 'necord';
import { connected } from 'process';
import { PlayDto, SkipDto, StopDto } from './player.dto';

@Injectable()
export class PlayerCommands {
  public constructor(
    private readonly playerManager: PlayerManager,
    private readonly lavalinkService: NecordLavalinkService,
  ) {}

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
        ephemeral: true,
        content: `Join a voice Channel`,
      });

    const vc = (interaction.member as GuildMember)?.voice
      ?.channel as VoiceChannel;
    if (!vc.joinable || !vc.speakable)
      return interaction.reply({
        ephemeral: true,
        content: 'I am not able to join your channel / speak in there.',
      });

    const player =
      this.playerManager.get(interaction.guildId) ??
      this.playerManager.create({
        ...this.lavalinkService.extractInfoForPlayer(interaction),
        selfDeaf: true,
        selfMute: false,
        volume: 100,
      });

    await player.connect();

    const response = await player.search(
      {
        query,
        source: 'youtube',
      },
      interaction.user.id,
    );

    await player.queue.add(
      response.loadType === 'playlist' ? response.tracks : response.tracks[0],
    );

    await interaction.reply({
      content:
        response.loadType === 'playlist'
          ? `✅ Added [${response.tracks.length}] Tracks${response.playlist?.title ? ` - from the ${response.pluginInfo.type || 'Playlist'} ${response.playlist.uri ? `[\`${response.playlist.title}\`](<${response.playlist.uri}>)` : `\`${response.playlist.title}\``}` : ''} at \`#${player.queue.tracks.length - response.tracks.length}\``
          : `✅ Added [\`${response.tracks[0].info.title}\`](<${response.tracks[0].info.uri}>) by \`${response.tracks[0].info.author}\` at \`#${player.queue.tracks.length}\``,
    });

    if (!player.playing)
      await player.play(connected ? { volume: 100, paused: false } : undefined);

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
        content: "I'm not connected",
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
        content: "I'm not connected",
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
}
