FROM node:20-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
RUN corepack prepare pnpm@latest --activate

RUN apt-get update && apt-get install -y --no-install-recommends \
	dumb-init \
	&& rm -rf /var/lib/apt/lists/*

FROM base AS dev
ENV NODE_ENV development
WORKDIR /app
USER node
ENTRYPOINT [ "/usr/bin/dumb-init", "--" ]
CMD [ "/bin/sh", "-c", "pnpm install && pnpm start:dev" ]

FROM base AS prod-base
ENV NODE_ENV production
COPY . /app
WORKDIR /app

FROM prod-base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base AS prod
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist

USER node
EXPOSE 8080

ENTRYPOINT [ "/usr/bin/dumb-init", "--" ]

CMD [ "pnpm", "start:prod" ]
