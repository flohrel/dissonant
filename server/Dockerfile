FROM node:21-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN corepack prepare pnpm@latest --activate
RUN apk add --no-cache \
	dumb-init \
	&& rm -rf /var/cache/apk/*

FROM base AS dev
ENV NODE_ENV development
WORKDIR /app
RUN apk add --no-cache --virtual .build-deps \
	alpine-sdk \
	python3
USER node
ENTRYPOINT [ "/usr/bin/dumb-init", "--" ]
CMD [ "/bin/sh", "-c", "pnpm install && pnpm start:dev" ]

FROM base AS prod-base
ENV NODE_ENV production
COPY . /app
WORKDIR /app

FROM prod-base AS prod-deps
RUN	--mount=type=cache,id=pnpm,target=/pnpm/store apk add --no-cache --virtual .build-deps \
	alpine-sdk \
	python3 \
	&& pnpm install --prod --frozen-lockfile \
	&& apk del .build-deps

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store apk add --no-cache --virtual \
	alpine-sdk \
	python3 \
	&& pnpm install --prod --frozen-lockfile \
	&& apk del .build-deps
RUN pnpm run build

FROM base AS prod
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
USER node
EXPOSE 8080
ENTRYPOINT [ "/usr/bin/dumb-init", "--" ]
CMD [ "pnpm", "start:prod" ]
