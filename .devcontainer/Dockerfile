FROM mcr.microsoft.com/devcontainers/typescript-node AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
RUN corepack prepare pnpm@latest --activate

RUN pnpm add -g pnpm
RUN pnpm add -g jest

RUN sudo apt-get update && sudo apt-get install gnupg2 -y

# COPY ~/.ssh /home/node/.ssh
# COPY ~/.gnupg /home/node/.gnupg

WORKDIR /workspace