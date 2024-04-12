import { LengthDto } from '@/dto/length.dto';
import { Injectable } from '@nestjs/common';
import { InteractionResponse } from 'discord.js';
import { Context, Options, SlashCommand, SlashCommandContext } from 'necord';

@Injectable()
export class AppCommands {
  @SlashCommand({ name: 'ping', description: 'Ping-Pong Command' })
  public async onPing(
    @Context() [interaction]: SlashCommandContext,
  ): Promise<InteractionResponse<boolean>> {
    return interaction.reply({
      content: `Pong! guild: ${interaction.guildId}`,
    });
  }

  @SlashCommand({ name: 'length', description: 'Get length of text' })
  public async onLength(
    @Context() [interaction]: SlashCommandContext,
    @Options() { text }: LengthDto,
  ): Promise<InteractionResponse<boolean>> {
    return interaction.reply({ content: `Length of your text ${text.length}` });
  }
}
