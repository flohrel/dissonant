import { StringOption } from 'necord';

export class QueryDto {
  @StringOption({
    name: 'query',
    description: 'Youtube / Spotify / SoundCloud URL or a search query',
    required: true,
  })
  text: string;
}
