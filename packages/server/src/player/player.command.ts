import { Injectable } from '@nestjs/common';
import { InteractionResponse } from 'discord.js';
import { Context, SlashCommand, SlashCommandContext } from 'necord';

@Injectable()
export class PlayerCommands {
  @SlashCommand({ name: 'play', description: 'Add a musick track to queue' })
  public async onPlay(
    @Context() [interaction]: SlashCommandContext,
  ): Promise<InteractionResponse<boolean>> {
    return interaction.reply({
      content: `Not yet implemented!`,
    });
  }
}
