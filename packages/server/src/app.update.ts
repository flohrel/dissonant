import {
  OnNodeManager,
  NodeManagerContextOf,
  OnLavalinkManager,
  LavalinkManagerContextOf,
} from '@necord/lavalink';
import { Injectable, Logger } from '@nestjs/common';
import { Context, ContextOf, On, Once } from 'necord';

@Injectable()
export class AppUpdate {
  private readonly logger = new Logger(AppUpdate.name);

  @Once('ready')
  public onReady(@Context() [client]: ContextOf<'ready'>): void {
    this.logger.log(`Bot logged in as ${client.user.username}`);
  }

  @On('debug')
  public onDebug(@Context() [message]: ContextOf<'debug'>): void {
    this.logger.debug(message);
  }

  @On('warn')
  public onWarn(@Context() [message]: ContextOf<'warn'>): void {
    this.logger.warn(message);
  }

  @On('error')
  public onError(@Context() [message]: ContextOf<'error'>): void {
    this.logger.error(message);
  }

  @OnNodeManager('connect')
  public onConnect(@Context() [node]: NodeManagerContextOf<'connect'>) {
    this.logger.log(`Node: ${node.options.id} Connected`);
  }

  @OnLavalinkManager('playerCreate')
  public onPlayerCreate(
    @Context() [player]: LavalinkManagerContextOf<'playerCreate'>,
  ) {
    this.logger.log(`Player created at ${player.guildId}`);
  }
}
