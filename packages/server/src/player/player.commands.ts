import { PlayerManager } from '@necord/lavalink';
import { Injectable, Logger, UseInterceptors } from '@nestjs/common';
import {
  blockQuote,
  bold,
  EmbedBuilder,
  GuildMember,
  inlineCode,
  InteractionContextType,
  MessageFlags,
  quote,
  subtext,
  VoiceChannel,
} from 'discord.js';
import * as Joi from 'joi';
import {
  SearchResult,
  UnresolvedSearchResult,
} from 'lavalink-client/dist/types';
import { Context, Options, SlashCommand, SlashCommandContext } from 'necord';
import { format_HHMMSS } from '../utils/time';
import { PlayDto, SkipDto } from './player.dto';
import { PlayerService } from './player.service';
import { AutocompletePayload } from './player.types';
import { QueryAutocompleteInterceptor } from './query.interceptor';

@Injectable()
export class PlayerCommands {
  private readonly logger = new Logger(PlayerCommands.name);
  public constructor(
    private readonly playerManager: PlayerManager,
    private readonly playerService: PlayerService,
  ) {}

  @UseInterceptors(QueryAutocompleteInterceptor)
  @SlashCommand({
    name: 'play',
    description: 'Play a track',
    contexts: [InteractionContextType.Guild],
  })
  public async onPlay(
    @Context() [interaction]: SlashCommandContext,
    @Options() { payload }: PlayDto,
  ) {
    if (!interaction.guildId) return;

    const vcId = (interaction.member as GuildMember)?.voice?.channelId;
    if (!vcId)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: `⚠️ ${bold('You need to be in a voice channel')}`,
      });
    const vc = (interaction.member as GuildMember)?.voice
      ?.channel as VoiceChannel;
    if (!vc.joinable)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: `⚠️ ${bold("I don't have permission to join your voice channel")}`,
      });
    if (!vc.speakable)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: `⚠️ ${bold("I don't have permission to speak in your voice channel")}`,
      });

    await interaction.deferReply();

    let payloadObj: AutocompletePayload;
    let response: SearchResult | UnresolvedSearchResult;

    try {
      payloadObj = JSON.parse(payload);
      Joi.assert(
        payloadObj,
        Joi.object({
          query: Joi.string().required(),
          selectedIndex: Joi.number().optional(),
        }),
      );
    } catch (error) {
      payloadObj = { query: payload, selectedIndex: undefined };
      this.logger.error('Search payload validation failed');
      if (error instanceof Joi.ValidationError) {
        this.logger.error(error.details.map((e) => e.message).join('\n'));
      } else {
        this.logger.error(`${error.name}: ${error.message}`);
      }
    }

    response = await this.playerService.search(interaction, payloadObj.query);

    switch (response.loadType) {
      case 'empty':
        return interaction.editReply({
          content: `⚠️ ${bold('No tracks found')}`,
        });
      case 'error':
        return interaction.editReply({
          content: `⚠️ ${bold(`Failed to load: ${response.exception?.message}`)}`,
        });
      case 'playlist':
        this.playerService.play(response.tracks, interaction);
        return interaction.editReply({
          content: `Playlist ${inlineCode(response.playlist?.title || '')} added by ${interaction.user.displayName} to queue`,
        });
      case 'search':
      case 'track':
        var track = response.tracks[payloadObj.selectedIndex ?? 0];
        this.playerService.play([track], interaction);
        return interaction.editReply({
          content: `Track ${track.info.sourceName !== 'youtube' ? inlineCode(track.info.author + ' - ' + track.info.title) : inlineCode(track.info.title)} added by ${interaction.user.displayName} to queue`,
        });
      default:
        return;
    }
  }

  @SlashCommand({
    name: 'stop',
    description: 'Stop player and clear queue',
    contexts: [InteractionContextType.Guild],
  })
  public async onStop(
    @Context() [interaction]: SlashCommandContext,
    // @Options() { clearQueue }: StopDto,
  ) {
    if (!interaction.guildId) return;
    const vcId = (interaction.member as GuildMember)?.voice?.channelId;
    const player = this.playerManager.get(interaction.guildId);

    if (!player)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: `⚠️ ${bold('No music is playing')}`,
      });
    if (!vcId)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: `⚠️ ${bold('You need to be in a voice channel')}`,
      });
    if (player.voiceChannelId !== vcId)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: `⚠️ ${bold('You need to be in my voice channel')}`,
      });

    await player.stopPlaying(true, false);

    return interaction.reply({
      content: `⏹️ ${bold('Player stopped and queue cleared')}`,
    });
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
    let player = this.playerManager.get(interaction.guildId);

    if (!player)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: `⚠️ ${bold('No music is playing')}`,
      });
    if (!vcId)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: `⚠️ ${bold('Join need to be in a voice channel')}`,
      });
    if (player.voiceChannelId !== vcId)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: `⚠️ ${bold('You need to be in my voice channel')}`,
      });

    try {
      await player.skip(skipTo ?? 0, true);
    } catch (error) {
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: `⚠️ **${error.message}**`,
      });
    }

    const newTrack = player.queue.current;

    return interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: `Skipped to track ${newTrack?.info.sourceName !== 'youtube' ? inlineCode(newTrack?.info.author + ' - ' + newTrack?.info.title) : inlineCode(newTrack?.info.title)}`,
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
        content: `⚠️ ${bold('No music is playing')}`,
      });
    if (!vcId)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: `⚠️ ${bold('You need to be in a voice channel')}`,
      });
    if (player.voiceChannelId !== vcId)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: `⚠️ ${bold('You need to be in my voice channel')}`,
      });

    const currentTrackInfo = player.queue.current?.info;
    const trackList = player.queue.tracks;

    if (trackList.length === 0)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: `⚠️ ${bold('The queue is empty')}`,
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
                      return acc + (track.info.duration ?? 0);
                    }, currentTrackInfo?.duration ?? 0),
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
