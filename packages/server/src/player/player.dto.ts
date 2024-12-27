import { BooleanOption, IntegerOption, StringOption } from 'necord';

export class PlayDto {
  @StringOption({
    name: 'query',
    description: ' <name | url> of the requested track',
    required: true,
  })
  public readonly query!: string;
}

export class StopDto {
  @BooleanOption({
    name: 'clear',
    description: 'Should the queue be cleared? (default true)',
    required: false,
  })
  public readonly clearQueue?: boolean;
}

export class SkipDto {
  @IntegerOption({
    name: 'track',
    description: 'Track number to skip to',
    required: false,
  })
  public readonly skipTo?: number;
}
