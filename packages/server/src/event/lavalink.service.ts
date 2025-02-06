import { LavalinkManagerContextOf, OnLavalinkManager } from '@necord/lavalink';
import { Injectable, Logger } from '@nestjs/common';
import { ChannelManager, EmbedBuilder, UserManager } from 'discord.js';
import { Context } from 'necord';

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
    this.logger.debug(`Track ${track?.info.identifier} started playing`);

    if (!player.textChannelId) return;

    let embed = new EmbedBuilder();
    embed
      .setAuthor({
        name: '▶️ Now playing',
      })
      .setTitle(
        (track?.info.sourceName !== 'youtube'
          ? track?.info.author!.toUpperCase() + ' - '
          : '') + track?.info.title,
      )
      .setThumbnail(player.queue.current?.pluginInfo.albumArtUrl || null)
      .setURL(player.queue.current?.info.uri || null)
      // .addFields({
      //   name: 'Requested by',
      //   value:
      //     '> ' +
      //       this.users.cache.get(
      //         player.queue.current?.userData?.requestedBy as string,
      //       )?.displayName || 'unknown',
      //   inline: true,
      // })
      // .addFields({
      //   name: `Duration`,
      //   value: `> ${new Duration(
      //     player.queue.tracks.reduce((acc, track) => {
      //       return acc + (track.info.duration || 0);
      //     }, 0),
      //   ).format()}`,
      //   inline: true,
      // })
      // .addFields({
      //   name: `Tracks`,
      //   value: `> ${player.queue.tracks.length}`,
      //   inline: true,
      // });
      // .setTimestamp()
      .setFooter({
        text: `requested by ${this.users.cache.get(track?.userData?.requesterId as string)?.username}`,
      });
    const channel = this.channels.cache.get(player.textChannelId);
    channel?.isSendable() && channel.send({ embeds: [await embed] });
  }
}
