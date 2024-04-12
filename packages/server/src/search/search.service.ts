import { Injectable } from '@nestjs/common';
import { YouTube } from 'youtube-sr';
import { streamUrlRegex, urlRegex } from './types/url.types';

@Injectable()
export class SearchService {
  public isUrl(url: string): { isUrl: boolean; type?: keyof typeof urlRegex } {
    if (!url.match(urlRegex)) {
      return { isUrl: false };
    } else {
      for (const [key, regex] of Object.entries(streamUrlRegex)) {
        if (url.match(regex)) {
          return { isUrl: true, type: key as keyof typeof urlRegex };
        }
      }
      return { isUrl: true };
    }
  }

  public async searchYoutube(query: string): Promise<string> {
    try {
      const videos = await YouTube.search(query, { type: 'video', limit: 5 });
      return videos.map((m, i) => `[${++i}] ${m.title} (${m.url})`).join('\n');
    } catch (error) {
      return `An error occurred while searching: ${error.message}`;
    }
  }
}
