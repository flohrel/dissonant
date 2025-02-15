import { IntegerOption, StringOption } from 'necord';

/**
 * DTO for the play command
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

// export class StopDto {
//   @BooleanOption({
//     name: 'clear',
//     description: 'Should the queue be cleared? (default true)',
//     required: false,
//   })
//   public readonly clearQueue?: boolean;
// }

export class SkipDto {
  @IntegerOption({
    name: 'track',
    description: 'Track number to skip to',
    required: false,
  })
  public readonly skipTo?: number;
}

export class FttsDto {
  @StringOption({
    name: 'text',
    description: 'Text to convert to speech',
    required: true,
  })
  public readonly text!: string;
}
