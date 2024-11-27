import { AppModule } from '@/app.module';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
const { generateDependencyReport } = require('@discordjs/voice');

const DEFAULT_PORT = 3000;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  const port = process.env.PORT ? parseInt(process.env.PORT) : DEFAULT_PORT;
  Logger.debug(generateDependencyReport());
  await app.listen(port);
}

bootstrap().catch((error) => {
  console.error('Error while launching the app:', error);
});
