import { GuildOnlyGuard } from '@/common/guards/guild-only.guard';
import {
  VoiceChannelContext,
  VoiceChannelPipe,
} from '@/player/voice-channel.pipe';
import { PlayerManager } from '@necord/lavalink';
import { Injectable, UseGuards } from '@nestjs/common';
import { bold, InteractionContextType } from 'discord.js';
import { Context, SlashCommand } from 'necord';

@UseGuards(GuildOnlyGuard)
@Injectable()
export class StopCommand {
  public constructor(private readonly playerManager: PlayerManager) {}

  @SlashCommand({
    name: 'stop',
    description: 'Stop player and clear queue',
    contexts: [InteractionContextType.Guild],
    guilds: [process.env.DISCORD_DEV_GUILD_ID!],
  })
  public async onStop(
    @Context(new VoiceChannelPipe()) interaction: VoiceChannelContext,
  ) {
    const player = this.playerManager.get(interaction.guild.id);
    if (!player) throw new Error('No music is playing');
    if (player.voiceChannelId !== interaction.member.voice.channelId)
      throw new Error('This action must be performed in my voice channel');

    await player.stopPlaying(true, false);

    return interaction.reply({
      content: `⏹️ ${bold('Player stopped and queue cleared')}`,
    });
  }
}
