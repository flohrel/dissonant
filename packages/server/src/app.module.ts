import { PlayerModule } from '@/player/player.module';
import { SearchModule } from '@/search/search.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IntentsBitField } from 'discord.js';
import * as Joi from 'joi';
import { NecordModule } from 'necord';
import { AppCommands } from './app.command';
import { AppUpdate } from './app.update';

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
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.DirectMessages,
      ],
    }),
    PlayerModule,
    SearchModule,
  ],
  providers: [AppUpdate, AppCommands],
})
export class AppModule {}
