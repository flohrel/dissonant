import { Duration } from 'yt-search';
import { UserPayload } from './user-payload.type';

export type Track = {
  id: string;
  videoId: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: Duration;
  authorUrl: string;
  authorName: string;
  requestedBy: Pick<UserPayload, 'id' | 'displayName' | 'avatar'>;
};
