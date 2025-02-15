import { NecordLavalinkService, PlayerManager } from '@necord/lavalink';
import { Injectable, Logger } from '@nestjs/common';
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
} from 'discord.js';
import {
  Player,
  SearchResult,
  Track,
  UnresolvedSearchResult,
  UnresolvedTrack,
} from 'lavalink-client/dist/types';
import { delay } from 'lodash';

@Injectable()
export class PlayerService {
  private readonly logger = new Logger(PlayerService.name);
  private readonly searchCache = new Map<
    string,
    Promise<SearchResult | UnresolvedSearchResult>
  >();

  public constructor(
    private readonly playerManager: PlayerManager,
    private readonly lavalinkService: NecordLavalinkService,
  ) {}

  public async search(
    interaction: ChatInputCommandInteraction | AutocompleteInteraction,
    query: string,
  ): Promise<SearchResult | UnresolvedSearchResult> {
    const player = this.getPlayer(interaction);

    if (this.searchCache.has(query)) {
      return this.searchCache.get(query)!;
    } else {
      const response = player.search({ query }, interaction.user.id);
      this.searchCache.set(query, response);
      delay(() => this.searchCache.delete(query), 60000);
      return response;
    }
  }

  public async play(
    tracks: (Track | UnresolvedTrack)[],
    interaction: ChatInputCommandInteraction | AutocompleteInteraction,
  ): Promise<void> {
    const player = this.getPlayer(interaction);

    tracks.forEach((track) => {
      track.userData = {
        id: interaction.user.id,
      };
    });

    player.queue.add(tracks);

    if (!player.connected) await player.connect();

    if (!player.playing && !player.paused)
      player.play({ volume: 100, paused: false });

    return;
  }

  public getPlayer(
    interaction: ChatInputCommandInteraction | AutocompleteInteraction,
  ): Player {
    const player =
      this.playerManager.get(interaction.guildId!) ??
      this.playerManager.create({
        ...this.lavalinkService.extractInfoForPlayer(interaction),
        selfDeaf: true,
        selfMute: false,
        volume: 100,
      });

    return player;
  }
}
