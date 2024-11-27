import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { EmbedBuilder } from 'discord.js';
import { createWriteStream } from 'fs';
import { VideoMetadataResult } from 'yt-search';
import { queryMetadata, SearchService } from '../search/search.service';
import { ChannelQueue } from './types/channel-queue.type';
import { UserPayload } from './types/user-payload.type';
import Vibrant = require('node-vibrant');

@Injectable()
export class PlayerService {
  constructor(
    private readonly httpService: HttpService,
    private readonly searchService: SearchService,
  ) {}
  private readonly queue: Map<string, ChannelQueue> = new Map();

  public async downloadImage(url?: string): Promise<string> {
    if (!url) {
      return Promise.reject('No image URL provided');
    }
    const filename = 'tmp/' + url.split('/').pop();

    return new Promise((resolve, reject) => {
      this.httpService.axiosRef
        .get(url, { responseType: 'stream' })
        .then((res) => {
          const writer = createWriteStream(filename, {
            flags: 'w',
          });
          res.data.pipe(writer);
          writer.on('finish', () => {
            Logger.debug(`Image downloaded: ${filename}`, 'PlayerService');
          });
          writer.on('error', (err) => {
            reject(`Error writing image: ${err}`);
          });
          writer.on('close', () => {
            Logger.debug(`Image saved: ${filename}`, 'PlayerService');
            resolve(filename);
          });
        })
        .catch((err) => {
          reject(`Error downloading image: ${err}`);
        });
    });
  }

  public async getVibrantColor(filepath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      Vibrant.from(filepath)
        .getPalette()
        .then((palette) => {
          if (!palette.Vibrant) {
            reject('vibrant color not found');
          } else {
            Logger.debug('Vibrant color found', 'PlayerService');
            resolve(
              (palette.Vibrant.r << 16) |
                (palette.Vibrant.g << 8) |
                palette.Vibrant.b,
            );
          }
        })
        .catch((err) => {
          reject(`palette not found: ${err}`);
        });
    });
  }

  public async setEmbed(
    userPayload: UserPayload,
    metadata: queryMetadata,
  ): Promise<EmbedBuilder> {
    const image = metadata.video?.image ?? metadata.playlist?.image;

    return this.downloadImage(image)
      .then((file) => this.getVibrantColor(file))
      .then((color) => {
        return new EmbedBuilder()
          .setColor(color)
          .setAuthor({
            name: 'NOW PLAYING',
          })
          .setTitle(
            '▶ ' +
              ((metadata.video?.title || metadata.playlist?.title) ??
                'Unknown'),
          )
          .setImage(metadata.video?.image || metadata.playlist?.image || null)
          .setURL(metadata.video?.url || metadata.playlist?.url || null);
        // .setTimestamp()
        // .setFooter({
        //   text: userPayload.displayName,
        //   iconURL: userPayload?.avatar,
        // });
      })
      .catch((err) => {
        Logger.error(`Error creating embed: ${err}`, 'PlayerService');
        return new EmbedBuilder();
      });
  }

  public async addTracksToQueue(
    userPayload: UserPayload,
    tracksMetadata: VideoMetadataResult[],
  ): Promise<void> {
    if (this.queue.has(userPayload.guildId) === false) {
      this.queue.set(userPayload.guildId, {
        tracks: [],
      });
    }
    const queue = this.queue.get(userPayload.guildId);
    if (!queue) {
      return;
    }
    tracksMetadata.forEach((track) => {
      Logger.debug(`Track added: ${track.title}`, 'PlayerService');
      queue.tracks.push({
        id: track.videoId,
        videoId: track.videoId,
        title: track.title,
        url: track.url,
        thumbnail: track.image,
        duration: track.duration,
        authorUrl: track.author.url,
        authorName: track.author.name,
        requestedBy: userPayload,
      });
    });
  }
}
