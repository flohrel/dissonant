import { NecordLavalinkModule } from '@necord/lavalink';
import { NecordPaginationModule } from '@necord/pagination';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IntentsBitField, Partials } from 'discord.js';
import * as Joi from 'joi';
import { NecordModule } from 'necord';
import { AppUpdate } from './app.service';
import { LavalinkEvent } from './event/lavalink.service';
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
        DISCORD_APP_ID: Joi.required(),
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
      // development: [process.env.DISCORD_DEV_GUILD_ID!],
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.DirectMessages,
      ],
      partials: [Partials.Message, Partials.Channel],
      // skipRegistration: true,
    }),
    NecordLavalinkModule.forRoot({
      nodes: [
        {
          host: process.env.LAVALINK_HOST!,
          port: Number(process.env.LAVALINK_PORT!),
          id: 'test_node',
          sessionId: 'test_session',
          authorization: process.env.LAVALINK_PASSWORD!,
          requestSignalTimeoutMS: 3000,
          closeOnError: true,
          heartBeatInterval: 30_000,
          enablePingOnStatsCheck: true,
          retryDelay: 10e3,
          retryAmount: 5,
          secure: false,
        },
      ],
      autoSkip: true,
      autoSkipOnResolveError: true,
      client: {
        id: process.env.DISCORD_APP_ID!,
        username: 'Dissonant',
      },
      emitNewSongsOnly: true,
      playerOptions: {
        maxErrorsPerTime: {
          threshold: 35_000,
          maxAmount: 3,
        },
        minAutoPlayMs: 10_000,
        applyVolumeAsFilter: false,
        clientBasedPositionUpdateInterval: 50,
        defaultSearchPlatform: 'spsearch',
        onDisconnect: {
          autoReconnect: true,
          autoReconnectOnlyWithTracks: true,
          destroyPlayer: false,
        },
        onEmptyQueue: {
          destroyAfterMs: 30_000,
        },
        useUnresolvedData: true,
      },
      queueOptions: {
        maxPreviousTracks: 10,
      },
      linksAllowed: true,
      linksBlacklist: [],
      linksWhitelist: [],
      advancedOptions: {
        enableDebugEvents: true,
        maxFilterFixDuration: 600_000,
        debugOptions: {
          noAudio: false,
          playerDestroy: {
            dontThrowError: false,
            debugLog: false,
          },
          logCustomSearches: false,
        },
      },
    }),
    NecordPaginationModule.forRoot({
      buttons: {},
      allowSkip: true,
      allowTraversal: true,
      buttonsPosition: 'end',
    }),
    PlayerModule,
  ],
  providers: [AppUpdate, LavalinkEvent],
})
export class AppModule {}
