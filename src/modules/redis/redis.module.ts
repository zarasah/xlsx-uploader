import { Global, Module } from "@nestjs/common";
import { RedisController } from './redis.controller';
import { RedisService } from './redis.service';
import { ConfigModule, ConfigService } from "@nestjs/config";
import Redis from 'ioredis';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [RedisController],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST', 'localhost');
        const port = configService.get<number>('REDIS_PORT', 6379);

        const redisClient = new Redis({
          host,
          port,
        });

        redisClient.on('connect', () => console.log('✅ Redis connected!'));
        redisClient.on('error', (err) => console.error('❌ Redis Error:', err));
        redisClient.on('end', () => console.error('❌ Redis connection lost!'));

        return redisClient;
      },
    },
    RedisService
  ],
  exports: [RedisService]
})
export class RedisModule {}
