import { AppModule } from '@/app.module';
import { NestFactory } from '@nestjs/core';

async function bootstrap(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
}

bootstrap().catch((error) => {
  console.error('Error while launching the app:', error);
});
