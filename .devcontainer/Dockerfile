FROM mcr.microsoft.com/devcontainers/typescript-node AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
RUN corepack prepare pnpm@latest --activate

RUN pnpm add -g pnpm jest

RUN apt-get update && apt-get install -y --no-install-recommends \
	build-essential \
	python3 \
	gnupg2 \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /workspace