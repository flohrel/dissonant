import { AppModule } from '@/app.module';
import { NestFactory } from '@nestjs/core';

const DEFAULT_PORT = 3000;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const port = process.env.PORT ? parseInt(process.env.PORT) : DEFAULT_PORT;
  await app.listen(port);
}

bootstrap().catch((error) => {
  console.error('Error while launching the app:', error);
});
