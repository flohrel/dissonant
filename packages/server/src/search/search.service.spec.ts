import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { streamUrlRegex } from './types/url.types';

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SearchService],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return false if not a url', () => {
    expect(service.isUrl('not a url')).toEqual({ isUrl: false });
  });

  it('should return search results', async () => {
    const results = (await service.searchYoutube('test')).toLowerCase();
    expect(results).toContain('test');
  });

  test.each([
    { name: 'Spotify', url: 'https://open.spotify.com/track/123' },
    { name: 'Spotify', url: 'http://open.spotify.com/track/123' },
    {
      name: 'Spotify',
      url: 'https://www.open.spotify.com/artist/5eBCPtU2iPbzuMRre9BePt?si=Orte0VEhQU6Rzc98a8rpwg',
    },
    {
      name: 'Spotify',
      url: 'http://www.open.spotify.com/artist/5eBCPtU2iPbzuMRre9BePt?si=Orte0VEhQU6Rzc98a8rpwg',
    },
    { name: 'Youtube', url: 'https://youtube.com/watch?v=123' },
    { name: 'Youtube', url: 'https://youtu.be/123' },
    { name: 'Youtube', url: 'http://www.youtube.com/watch?v=123' },
    { name: 'Youtube', url: 'http://youtu.be/123' },
    { name: 'SoundCloud', url: 'https://soundcloud.com/123' },
    { name: 'SoundCloud', url: 'http://soundcloud.com/123' },
    { name: 'SoundCloud', url: 'https://www.soundcloud.com/123' },
    { name: 'SoundCloud', url: 'http://www.soundcloud.com/123' },
  ])('should return true and $name if a $name url', ({ name, url }) => {
    expect(service.isUrl(url)).toEqual({
      isUrl: true,
      type: name as keyof typeof streamUrlRegex,
    });
  });
});
