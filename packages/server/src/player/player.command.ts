import { SearchService } from '@/search/search.service';
import { Injectable } from '@nestjs/common';
import { GuildMember } from 'discord.js';
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
  ): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'You must be in a guild to use this command',
        ephemeral: true,
      });
      return;
    }

    const member: GuildMember = interaction.member as GuildMember;
    if (!member?.voice.channel) {
      await interaction.reply({
        content: 'You need to be in a voice channel',
        ephemeral: true,
      });
      return;
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
    if (!queryMetadata.video && !queryMetadata.playlist) {
      await interaction.reply({
        content: 'No video/playlist found',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    const embed = this.playerService.setEmbed(userPayload, queryMetadata);

    await interaction.editReply({
      embeds: [await embed],
    });

    const tracksMetadata = queryMetadata.playlist
      ? Promise.all(
          queryMetadata.playlist.videos.map((video) =>
            this.searchService.getVideo(video.videoId),
          ),
        )
      : [await this.searchService.getVideo(queryMetadata.video!.videoId)];

    await this.playerService.addTracksToQueue(
      userPayload,
      await tracksMetadata,
    );

    // await this.playerService.play();

    await interaction.editReply({
      embeds: [await embed],
    });
  }
}
