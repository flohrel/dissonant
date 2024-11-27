import { Injectable } from '@nestjs/common';
import {
  PlaylistMetadataResult,
  VideoMetadataResult,
  VideoSearchResult,
} from 'yt-search';
import yts = require('yt-search');

export type queryMetadata = {
  video: void | VideoMetadataResult | VideoSearchResult | undefined;
  playlist: PlaylistMetadataResult | undefined;
};

type YtUrlData = {
  videoId?: string;
  playlistId?: string;
};

// const URL_REGEX =
//   /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;
const YOUTUBE_URL_REGEX =
  /^(https?:\/\/)?((www\.)?youtube\.com|youtu\.be)\/.+$/;
const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

@Injectable()
export class SearchService {
  private getVideoId(url: string): YtUrlData | undefined {
    const location = new URL(url);
    const params = new URLSearchParams(location.search);

    if (VIDEO_ID_REGEX.test(location.pathname.slice(1))) {
      return {
        videoId: location.pathname.slice(1),
        playlistId: params.get('list') || undefined,
      };
    }
    const [type, shortId] = location.pathname.slice(1).split('/');
    if (type === 'shorts') {
      return {
        videoId: shortId,
        playlistId: undefined,
      };
    }
    const videoId = params.get('v');
    const playlistId = params.get('list');
    return {
      videoId: videoId || undefined,
      playlistId: playlistId || undefined,
    };
  }

  public async search(query: string): Promise<queryMetadata> {
    let video = undefined;
    let playlist = undefined;

    if (!query.match(YOUTUBE_URL_REGEX)) {
      video = yts(query)
        .then((res) => res.videos[0])
        .catch(console.error);
    } else {
      const urlData = this.getVideoId(query);
      if (urlData) {
        if (urlData.playlistId) {
          playlist = yts({ listId: urlData.playlistId });
        }
        if (urlData.videoId) {
          video = yts({ videoId: urlData.videoId });
        }
      }
    }
    return { video: await video, playlist: await playlist };
  }
}
