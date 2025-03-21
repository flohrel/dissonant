import { GuildOnlyGuard } from '@/common/guards/guild-only.guard';
import { SkipAutocomplete } from '@/player/autocomplete/skip.interceptor';
import { SkipDto } from '@/player/dto/skip.dto';
import {
  VoiceChannelContext,
  VoiceChannelPipe,
} from '@/player/voice-channel.pipe';
import { PlayerManager } from '@necord/lavalink';
import { Injectable, UseGuards, UseInterceptors } from '@nestjs/common';
import { inlineCode, InteractionContextType, MessageFlags } from 'discord.js';
import { Button, ButtonContext, Context, Options, SlashCommand } from 'necord';

@UseGuards(GuildOnlyGuard)
@Injectable()
export class SkipCommand {
  public constructor(private readonly playerManager: PlayerManager) {}

  @UseInterceptors(SkipAutocomplete)
  @SlashCommand({
    name: 'skip',
    description: 'Skip current track',
    contexts: [InteractionContextType.Guild],
    guilds: [process.env.DISCORD_DEV_GUILD_ID!],
  })
  public async onSkip(
    @Context(new VoiceChannelPipe()) interaction: VoiceChannelContext,
    @Options() { skipTo }: SkipDto,
  ) {
    const player = this.playerManager.get(interaction.guild.id);
    if (!player) throw new Error('No music is playing');
    if (player.voiceChannelId !== interaction.member.voice.channelId)
      throw new Error('This action must be performed in my voice channel');

    try {
      await player.skip(skipTo ?? 0, true);
    } catch (error) {
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: `⚠️ **${error.message}**`,
      });
    }

    const trackInfo = player.queue.current?.info;

    return interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: `Skipped to track ${trackInfo?.sourceName !== 'youtube' ? inlineCode(trackInfo?.author + ' - ' + trackInfo?.title) : inlineCode(trackInfo?.title)}`,
    });
  }

  @Button('skip')
  public onSkipButton(@Context() [interaction]: ButtonContext) {
    const player = this.playerManager.get(interaction.guildId!);

    player.skip();
  }
}
