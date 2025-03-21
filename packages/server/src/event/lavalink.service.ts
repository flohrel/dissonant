import { format_HHMMSS } from '@/common/utils/time';
import { LavalinkManagerContextOf, OnLavalinkManager } from '@necord/lavalink';
import { Injectable, Logger } from '@nestjs/common';
import {
  ActionRowBuilder,
  bold,
  ButtonBuilder,
  ButtonStyle,
  ChannelManager,
  EmbedBuilder,
  heading,
  HeadingLevel,
  hyperlink,
  inlineCode,
  Message,
  SendableChannels,
  subtext,
  User,
  userMention,
} from 'discord.js';
import { Track } from 'lavalink-client/dist/types';
import { Context } from 'necord';

@Injectable()
export class LavalinkEvent {
  private playerMessage: Message;

  public constructor(private readonly channels: ChannelManager) {}
  private readonly logger = new Logger(LavalinkEvent.name);

  @OnLavalinkManager('playerCreate')
  public onPlayerCreate(
    @Context() [player]: LavalinkManagerContextOf<'playerCreate'>,
  ) {
    this.logger.debug(`Player created at ${player.guildId}`);
  }

  @OnLavalinkManager('trackStart')
  public async onTrackStart(
    @Context() [player, track]: LavalinkManagerContextOf<'trackStart'>,
  ) {
    if (!player.textChannelId) {
      this.logger.warn(`No text channel found for ${player.guildId}`);
      return;
    }
    if (!track) {
      this.logger.warn(`No track found for ${player.guildId}`);
      return;
    }

    const channel = this.channels.cache.get(player.textChannelId);

    if (!channel) {
      this.logger.warn(`No channel found for ${player.guildId}`);
      return;
    }
    if (!channel.isSendable()) {
      this.logger.warn(`Channel not sendable for ${player.guildId}`);
      return;
    }
    this.#sendPlayerComponent(channel, track);
  }

  async #sendPlayerComponent(
    channel: SendableChannels,
    track: Track,
  ): Promise<void> {
    const trackInfo = track.info;
    const requester = track.requester as User;

    const embed = new EmbedBuilder()
      .setColor('DarkBlue')
      .setAuthor({ name: '🔊 Now Playing' })
      .setThumbnail(trackInfo.artworkUrl)
      .setURL(trackInfo.uri)
      .setDescription(
        heading(
          hyperlink(
            (trackInfo.sourceName !== 'youtube'
              ? trackInfo.author + ' — '
              : '') + trackInfo.title,
            trackInfo.uri,
          ),
          HeadingLevel.Three,
        ) +
          '\n' +
          subtext(
            bold(inlineCode(format_HHMMSS(trackInfo.duration))) +
              ' • ' +
              `requested by ${userMention(requester.id)}`,
          ),
      );

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('previous')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('1340748540217004072'),
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
    );

    await this.playerMessage?.delete();

    this.playerMessage = await channel.send({
      embeds: [await embed],
      components: [buttonRow],
    });
  }
}
