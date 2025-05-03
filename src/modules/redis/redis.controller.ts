import { Controller, Get, Param } from "@nestjs/common";
import { RedisService } from "./redis.service";

@Controller('redis')
export class RedisController {
  constructor(
    private readonly redisService: RedisService
  ) {
  }

  @Get('progress/:key')
  async getProgress(
    @Param('key') key: string
  ) {
    return this.redisService.getParsingProgress(key);
  }
}
