import { Injectable } from '@nestjs/common';
import { GuildMember } from 'discord.js';
import { LavalinkManager } from 'lavalink-client';
import { Context, Options, SlashCommand, SlashCommandContext } from 'necord';
import { QueryDto } from './dto/query.dto';

@Injectable()
export class PlayerCommands {
  public constructor(private readonly lavalinkManager: LavalinkManager) {}

  // @UseInterceptors(SourceAutocompleteInterceptor)
  @SlashCommand({
    name: 'play',
    description: 'Play a track',
  })
  public async onPlay(
    @Context() [interaction]: SlashCommandContext,
    @Options() { query }: QueryDto,
  ) {
    if (!interaction.guildId) {
      await interaction.reply({
        content: 'You must be in a guild to use this command',
        ephemeral: true,
      });
      return;
    }

    const member: GuildMember = interaction.member as GuildMember;
    if (!member?.voice.channelId) {
      await interaction.reply({
        content: 'You need to be in a voice channel',
        ephemeral: true,
      });
      return;
    }

    const player = this.lavalinkManager.createPlayer({
      guildId: interaction.guildId,
      voiceChannelId: member.voice.channelId,
      textChannelId: interaction.channelId,
      selfDeaf: true,
      selfMute: false,
      volume: 40,
    });

    await player.connect();

    const res = await player.search(
      {
        query,
        source: 'youtube',
      },
      interaction.user.id,
    );

    await player.queue.add(res.tracks[0]);

    if (!player.playing) await player.play();

    return interaction.reply({
      content: `Now playing ${res.tracks[0].info.title}`,
    });
  }
}
