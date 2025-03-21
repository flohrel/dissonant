import { GuildOnlyGuard } from '@/common/guards/guild-only.guard';
import {
  PlayAutocomplete,
  PlayAutocompletePayload,
} from '@/player/autocomplete/play.interceptor';
import {
  VoiceChannelContext,
  VoiceChannelPipe,
} from '@/player/voice-channel.pipe';
import { PlayerManager } from '@necord/lavalink';
import { Injectable, Logger, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  ActionRowBuilder,
  bold,
  ButtonBuilder,
  ButtonStyle,
  inlineCode,
  InteractionContextType,
} from 'discord.js';
import * as Joi from 'joi';
import {
  SearchResult,
  UnresolvedSearchResult,
} from 'lavalink-client/dist/types';
import { Button, ButtonContext, Context, Options, SlashCommand } from 'necord';
import { PlayDto } from '../dto/play.dto';
import { PlayerService } from '../player.service';

@UseGuards(GuildOnlyGuard)
@Injectable()
export class PlayCommand {
  private readonly logger = new Logger(PlayCommand.name);
  public constructor(
    private readonly playerService: PlayerService,
    private readonly playerManager: PlayerManager,
  ) {}

  @UseInterceptors(PlayAutocomplete)
  @SlashCommand({
    name: 'play',
    description: 'Play a track',
    contexts: [InteractionContextType.Guild],
    guilds: [process.env.DISCORD_DEV_GUILD_ID!],
  })
  public async onPlay(
    @Context(new VoiceChannelPipe()) interaction: VoiceChannelContext,
    @Options() { payload }: PlayDto,
  ) {
    await interaction.deferReply();

    let payloadObj: PlayAutocompletePayload;
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
      this.logger.debug(`Search query without autocomplete`);
      payloadObj = { query: payload, selectedIndex: undefined };
      if (error instanceof Joi.ValidationError) {
        this.logger.verbose(error.details.map((e) => e.message).join('\n'));
      } else {
        this.logger.verbose(`${error.name}: ${error.message}`);
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

  @Button('pause')
  public onPauseButton(@Context() [interaction]: ButtonContext) {
    const player = this.playerManager.get(interaction.guildId!);

    player.pause();

    interaction.update({
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('resume')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1340748594562469959'),
          new ButtonBuilder()
            .setCustomId('skip')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1340748562597679264'),
          new ButtonBuilder()
            .setCustomId('queue')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1340748635998261318'),
          new ButtonBuilder()
            .setDisabled(true)
            .setLabel('Dashboard')
            .setStyle(ButtonStyle.Link)
            .setURL('https://necord.js.org')
            .setEmoji('1340748608609189929'),
        ),
      ],
    });
  }

  @Button('resume')
  public onPlayButton(@Context() [interaction]: ButtonContext) {
    const player = this.playerManager.get(interaction.guildId!);

    player.resume();

    interaction.update({
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('pause')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1340748576510185644'),
          new ButtonBuilder()
            .setCustomId('skip')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1340748562597679264'),
          new ButtonBuilder()
            .setCustomId('queue')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1340748635998261318'),
          new ButtonBuilder()
            .setDisabled(true)
            .setLabel('Dashboard')
            .setStyle(ButtonStyle.Link)
            .setURL('https://necord.js.org')
            .setEmoji('1340748608609189929'),
        ),
      ],
    });
  }
}
