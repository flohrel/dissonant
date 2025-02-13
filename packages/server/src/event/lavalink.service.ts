import { LavalinkManagerContextOf, OnLavalinkManager } from '@necord/lavalink';
import { Injectable, Logger } from '@nestjs/common';
import {
  ChannelManager,
  EmbedBuilder,
  quote,
  subtext,
  UserManager,
} from 'discord.js';
import { Context } from 'necord';
import { format_HHMMSS } from '../utils/time';

@Injectable()
export class LavalinkEvent {
  public constructor(
    private readonly channels: ChannelManager,
    private readonly users: UserManager,
  ) {}
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
    const trackInfo = track?.info;
    const nextTrackInfo =
      player.queue.tracks.length > 0 ? player.queue.tracks[0].info : null;

    this.logger.debug(`Track ${trackInfo?.identifier} started playing`);

    if (!player.textChannelId) return;

    const embed = new EmbedBuilder();

    embed
      .setAuthor({
        name: '🔊 Now playing',
      })
      .setTitle(
        (trackInfo?.sourceName !== 'youtube'
          ? trackInfo?.author.toUpperCase() + ' - '
          : '') + trackInfo?.title,
      )
      .setURL(trackInfo?.uri || track?.pluginInfo.uri || null)
      .setThumbnail(
        trackInfo?.artworkUrl || track?.pluginInfo.albumArtUrl || null,
      )
      .setDescription(
        `${format_HHMMSS(trackInfo?.duration)} | requested by ${this.users.cache.get(track?.userData?.id as string)?.displayName}\n`,
      )
      .addFields(
        nextTrackInfo
          ? [
              {
                name: '\u200b\nNext',
                value:
                  `* [${nextTrackInfo.title.length > 40 ? nextTrackInfo.title.slice(0, 50) + '...' : nextTrackInfo.title}](${nextTrackInfo.uri})\n` +
                  quote(
                    subtext(
                      `${format_HHMMSS(nextTrackInfo.duration)} | requested by ${this.users.cache.get(player.queue.tracks[0].userData?.id as string)?.displayName}`,
                    ),
                  ),
              },
            ]
          : [],
      );
    const channel = this.channels.cache.get(player.textChannelId);
    channel?.isSendable() && channel.send({ embeds: [await embed] });
  }
}
