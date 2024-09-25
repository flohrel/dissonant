FROM node:21-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN corepack prepare pnpm@latest --activate
RUN apk add --no-cache dumb-init

FROM base AS server-dev
ENV NODE_ENV development
WORKDIR /app/dev/server
USER node
ENTRYPOINT [ "/usr/bin/dumb-init", "--" ]
CMD [ "pnpm", "start:dev" ]

FROM base AS build
ENV NODE_ENV production
COPY . /app
WORKDIR /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run -r build
RUN pnpm deploy --filter=server --prod /prod/server

FROM prod-build AS server-prod
COPY --from=build /prod/server /app
WORKDIR /app
USER node
ENTRYPOINT [ "/usr/bin/dumb-init", "--" ]
CMD [ "pnpm", "start:prod" ]

