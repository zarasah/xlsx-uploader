import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService: ConfigService = app.get(ConfigService);

  app.setGlobalPrefix('api');

  await app.listen(configService.get('PORT', 3000));
}
bootstrap().then(() =>
  Logger.log(`XLSX-Uploader successfully started in ${process.env.NODE_ENV || 'development'} mode`)
);
