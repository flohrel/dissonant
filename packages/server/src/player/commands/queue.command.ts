import { GuildOnlyGuard } from '@/common/guards/guild-only.guard';
import { format_HHMM_verbose, format_HHMMSS } from '@/common/utils/time';
import {
  VoiceChannelContext,
  VoiceChannelPipe,
} from '@/player/voice-channel.pipe';
import { PlayerManager } from '@necord/lavalink';
import { NecordPaginationService, PageBuilder } from '@necord/pagination';
import { Injectable, UseGuards } from '@nestjs/common';
import {
  bold,
  ButtonInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  hyperlink,
  inlineCode,
  InteractionContextType,
  MessageFlags,
  quote,
  subtext,
  User,
  userMention,
} from 'discord.js';
import { Button, ButtonContext, Context, SlashCommand } from 'necord';

@UseGuards(GuildOnlyGuard)
@Injectable()
export class QueueCommand {
  public constructor(
    private readonly playerManager: PlayerManager,
    private readonly paginationService: NecordPaginationService,
  ) {}

  @SlashCommand({
    name: 'queue',
    description: 'View the queue',
    contexts: [InteractionContextType.Guild],
    guilds: [process.env.DISCORD_DEV_GUILD_ID!],
  })
  public async onQueue(
    @Context(new VoiceChannelPipe()) interaction: VoiceChannelContext,
  ) {
    const player = this.playerManager.get(interaction.guild.id);
    if (!player) throw new Error('No music is playing');
    if (player.voiceChannelId !== interaction.member.voice.channelId)
      throw new Error('This action must be performed in my voice channel');
    const trackList = player.queue.tracks;

    if (trackList.length === 0)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: `⚠️ ${bold('The queue is empty')}`,
      });

    return this.#sendQueueComponent(interaction);
  }

  async #sendQueueComponent(
    interaction: ChatInputCommandInteraction | ButtonInteraction,
  ): Promise<void> {
    const player = this.playerManager.get(interaction.guildId!);
    const itemPerPage = 5;
    const nPage = Math.ceil(player.queue.tracks.length / itemPerPage);
    const pagination = this.paginationService.register((builder) =>
      builder.setCustomId('queue').setPages(
        Array.from({ length: nPage }, (_, i) => {
          const embed = new EmbedBuilder();
          embed
            .setTitle(`Next in queue (page ${i + 1}/${nPage})`)
            .setDescription(
              player.queue.tracks
                .slice(i * itemPerPage, i * itemPerPage + itemPerPage)
                .map((track, index) => {
                  const trackInfo = track.info;
                  const requester = track.requester as User;

                  return (
                    `* [` +
                    bold(`${i * itemPerPage + index + 1}`) +
                    `] ` +
                    hyperlink(
                      (trackInfo.sourceName !== 'youtube'
                        ? trackInfo.author + ' — '
                        : '') + trackInfo.title,
                      trackInfo.uri ?? '',
                    ) +
                    '\n' +
                    quote(
                      subtext(
                        bold(inlineCode(format_HHMMSS(trackInfo.duration))) +
                          ' • ' +
                          `requested by ${userMention(requester.id)}`,
                      ),
                    )
                  );
                })
                .join('\n') + (i < nPage - 1 ? '\n...' : ''),
            )
            .setFooter({
              text: `${player.queue.tracks.length} tracks, ${format_HHMM_verbose(player.queue.utils.totalDuration())}`,
            });
          return new PageBuilder().setEmbeds([embed]);
        }),
      ),
    );
    const page = await pagination.build();
    interaction.reply(page);
  }

  @Button('queue')
  public async onQueueButton(@Context() [interaction]: ButtonContext) {
    this.#sendQueueComponent(interaction);
  }
}
