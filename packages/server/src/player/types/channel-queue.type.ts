import { AudioPlayer, VoiceConnection } from '@discordjs/voice';
import { VoiceBasedChannel } from 'discord.js';
import { Track } from './track.type';

export type ChannelQueue = {
  tracks: Track[];
  managedPlayer?: {
    player: AudioPlayer;
    connection: VoiceConnection;
    channel: VoiceBasedChannel;
  };
};
