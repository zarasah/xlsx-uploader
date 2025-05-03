import { Injectable, OnModuleInit } from "@nestjs/common";
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AppService implements OnModuleInit {
  onModuleInit() {
    const uploadDir = path.resolve(process.cwd(), 'uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
  }

  getHello(): string {
    return 'Hello World!';
  }
}


