import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import {
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
  GuildTextBasedChannel,
  Snowflake,
  VoiceChannel,
} from 'discord.js';
import { SlashCommandContext } from 'necord';

export class VoiceChannelContext extends ChatInputCommandInteraction {
  private _channel: GuildTextBasedChannel;
  public get channel(): GuildTextBasedChannel {
    return this._channel;
  }
  public set channel(value: GuildTextBasedChannel) {
    this._channel = value;
  }
  public channelId: Snowflake;
  private _guild: Guild;
  public get guild(): Guild {
    return this._guild;
  }
  public set guild(value: Guild) {
    this._guild = value;
  }
  public guildId: Snowflake;
  public id: Snowflake;
  public member: GuildMember;
}

export
@Injectable()
class VoiceChannelPipe implements PipeTransform {
  transform([interaction]: SlashCommandContext, metadata: ArgumentMetadata) {
    if (!interaction.guild)
      throw new Error('Failed to retrieve guild information');
    if (!interaction.member)
      throw new Error('Failed to retrieve member information');

    const vc = (interaction.member as GuildMember).voice
      .channel as VoiceChannel;
    if (!vc) throw new Error('This action is only allowed in voice channels');
    if (!vc.joinable) throw new Error('This voice channel is not joinable');
    if (!vc.speakable) throw new Error('This voice channel is not speakable');

    return interaction as VoiceChannelContext;
  }
}
