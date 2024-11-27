import { SearchService } from '@/search/search.service';
import { Injectable } from '@nestjs/common';
import { GuildMember, InteractionResponse } from 'discord.js';
import { Context, Options, SlashCommand, SlashCommandContext } from 'necord';
import { PlayDto } from './dto/play.dto';
import { PlayerService } from './player.service';
import { UserPayload } from './types/user-payload.type';

@Injectable()
export class PlayerCommands {
  constructor(
    private readonly playerService: PlayerService,
    private readonly searchService: SearchService,
  ) {}

  @SlashCommand({ name: 'play', description: 'Add a musick track to queue' })
  public async onPlay(
    @Context() [interaction]: SlashCommandContext,
    @Options() { query }: PlayDto,
  ): Promise<InteractionResponse<boolean>> {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'You must be in a guild to use this command',
        ephemeral: true,
      });
    }
    const member: GuildMember = interaction.member as GuildMember;
    if (!member?.voice.channel) {
      return interaction.reply({
        content: 'You need to be in a voice channel',
        ephemeral: true,
      });
    }
    const userPayload: UserPayload = {
      id: member.id,
      displayName: member.displayName,
      avatar: member.user.avatarURL() || undefined,
      guildId: interaction.guild.id,
      guildName: interaction.guild.name,
      guildIcon: interaction.guild.icon || undefined,
    };
    const queryMetadata = await this.searchService.search(query);
    const embed = await this.playerService.getEmbed(userPayload, queryMetadata);

    return interaction.reply({
      embeds: [embed],
    });
  }
}
