import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });
  const port = process.env.PORT || 3001;
  await app.listen(port);
}
bootstrap();
