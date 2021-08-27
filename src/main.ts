if (!process.env.IS_TS_NODE) {
  require('module-alias/register');
}

import * as cookieParser from 'cookie-parser';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  await app.listen(5000);
}
bootstrap();
