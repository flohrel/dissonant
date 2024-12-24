import { NecordLavalinkModule } from '@necord/lavalink';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IntentsBitField } from 'discord.js';
import * as Joi from 'joi';
import { NecordModule } from 'necord';
import { AppUpdate } from './app.update';
import { PlayerModule } from './player/player.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: true,
      isGlobal: false,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        DISCORD_BOT_TOKEN: Joi.required(),
        DISCORD_DEV_GUILD_ID: Joi.required(),
        LAVALINK_HOST: Joi.required(),
        LAVALINK_PORT: Joi.number().required(),
        LAVALINK_PASSWORD: Joi.required(),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    NecordModule.forRoot({
      token: process.env.DISCORD_BOT_TOKEN!,
      development: [process.env.DISCORD_DEV_GUILD_ID!],
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.GuildMembers,
      ],
    }),
    NecordLavalinkModule.forRoot({
      nodes: [
        {
          host: process.env.LAVALINK_HOST!,
          port: Number(process.env.LAVALINK_PORT!),
          authorization: process.env.LAVALINK_PASSWORD!,
        },
      ],
    }),
    PlayerModule,
  ],
  providers: [AppUpdate],
})
export class AppModule {}
