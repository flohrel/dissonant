/**
 * Information required to create a Player instance
 */
export interface PlayerInfo {
  guildId: string | null;
  voiceChannelId: string | null;
  textChannelId: string;
}

export interface AutocompletePayload {
  query: string;
  selectedIndex?: number;
}
