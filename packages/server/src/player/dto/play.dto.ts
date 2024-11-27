import { StringOption } from 'necord';

export class PlayDto {
  @StringOption({
    name: 'play',
    description: 'Youtube URL or a search query',
    required: true,
  })
  query: string;
}
