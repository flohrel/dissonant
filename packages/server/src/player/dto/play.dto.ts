import { StringOption } from 'necord';

/**
 * DTO for the 'play' command
 * @description The payload can be a serialized AutocompletePayload object if the user selected a track from the autocomplete menu
 */
export class PlayDto {
  @StringOption({
    name: 'query',
    description: ' <name | url> of the requested track',
    required: true,
    autocomplete: true,
  })
  public readonly payload!: string;
}
