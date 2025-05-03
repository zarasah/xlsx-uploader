import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from "@nestjs/config";
import { ImportModule } from './modules/import/import.module';
import { DatabaseModule } from './modules/database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import databaseConfig from "./configs/database.config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { GatewayModule } from "./modules/gateway/gateway.module";


@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig],
      envFilePath: `.${process.env.NODE_ENV || 'development'}.env`,
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    RedisModule,
    ImportModule,
    GatewayModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
