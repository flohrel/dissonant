FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN corepack prepare pnpm@latest --activate
RUN apk add --no-cache dumb-init libc6-compat
USER node
WORKDIR /app
COPY --chown=node:node . /app

FROM base AS dev
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install
ENTRYPOINT [ "/usr/bin/dumb-init", "--" ]
CMD [ "sh", "-c", "export DISCORD_BOT_TOKEN=`cat /run/secrets/discord_bot_token` DISCORD_DEV_GUILD_ID=`cat /run/secrets/discord_dev_guild_id` LAVALINK_HOST=`cat /run/secrets/lavalink_host` LAVALINK_PORT=`cat /run/secrets/lavalink_port` LAVALINK_PASSWORD=`cat /run/secrets/lavalink_password` ; pnpm start:dev" ]

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM prod-deps AS prod-build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base AS prod
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=prod-build /app/dist /app/dist
ENTRYPOINT [ "/usr/bin/dumb-init", "--" ]
CMD [ "sh", "-c", "export DISCORD_BOT_TOKEN=`cat /run/secrets/discord_bot_token` DISCORD_DEV_GUILD_ID=`cat /run/secrets/discord_dev_guild_id` ; pnpm start:prod" ]
