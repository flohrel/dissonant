import { PlayerModule } from '@/player/player.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IntentsBitField } from 'discord.js';
import * as Joi from 'joi';
import { NecordModule } from 'necord';
import { AppUpdate } from './app.update';
// import { SpotifyApiModule } from './spotify-api/spotify-api.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development'],
      ignoreEnvFile: false,
      isGlobal: false,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        DISCORD_BOT_TOKEN: Joi.required(),
        DISCORD_DEV_GUILD_ID: Joi.required(),
        // SPOTIFY_CLIENT_ID: Joi.required(),
        // SPOTIFY_CLIENT_SECRET: Joi.required(),
        // DISCOGS_CONSUMER_KEY: Joi.optional(),
        // DISCOGS_CONSUMER_SECRET: Joi.optional(),
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
    PlayerModule,
    // SpotifyApiModule,
    // SearchModule,
  ],
  providers: [AppUpdate],
})
export class AppModule {}
