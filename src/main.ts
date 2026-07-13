/* eslint-disable @typescript-eslint/no-floating-promises */
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(cookieParser());

  const allowedOrigins = [
    'http://localhost:4500',
    'http://192.168.20.233:4500',
    'http://localhost:4600',
    'http://192.168.20.233:4600',
    'https://notification.edl.com.la',
    'https://notification-api.edl.com.la',
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const port = process.env.PORT || 4700;
  await app.listen(port);
}
bootstrap();
