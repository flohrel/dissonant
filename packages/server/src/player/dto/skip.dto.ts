import { IntegerOption } from 'necord';

/**
 * DTO for the 'skip' command
 */
export class SkipDto {
  @IntegerOption({
    name: 'track',
    description: 'Track to skip to',
    required: false,
    autocomplete: true,
  })
  public readonly skipTo?: number;
}
