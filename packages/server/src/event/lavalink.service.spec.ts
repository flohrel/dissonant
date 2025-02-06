import { Test, TestingModule } from '@nestjs/testing';
import { LavalinkEvent } from './lavalink.service';

describe('LavaplayerEvent', () => {
  let service: LavalinkEvent;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LavalinkEvent],
    }).compile();

    service = module.get<LavalinkEvent>(LavalinkEvent);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
