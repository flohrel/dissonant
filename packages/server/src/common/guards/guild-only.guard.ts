import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { BaseInteraction, Message } from 'discord.js';
import { NecordExecutionContext } from 'necord';

@Injectable()
export class GuildOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const ctx = NecordExecutionContext.create(context);
    const i = ctx.getContext()[0];

    if (
      (i instanceof BaseInteraction && !i.inCachedGuild()) ||
      (i instanceof Message && !i.inGuild())
    ) {
      throw new ForbiddenException(
        'This action is only allowed inside Discord servers',
      );
    }

    return true;
  }
}
