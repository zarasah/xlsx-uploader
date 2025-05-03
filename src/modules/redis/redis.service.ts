import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  async setParsingProgress(key: string, progress: number): Promise<void> {
    await this.redisClient.set(key, progress.toString());
  }

  async getParsingProgress(key: string) {
    const progress = await this.redisClient.get(key);
    return {
      progress: progress ? parseInt(progress, 10) : 0
    }
  }
}
