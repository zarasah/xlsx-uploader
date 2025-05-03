import { Controller, Get, HttpException, HttpStatus, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { ImportService } from "./import.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { multerConfig } from "../../configs/multer.config";
import { GroupedDataDto } from "./dto/grouped.data.dto";

@Controller('import')
export class ImportController {
  constructor(
    private readonly importService: ImportService
  ) {
  }

  @Get('grouped')
  async getGroupedData(): Promise<GroupedDataDto[]> {
    return this.importService.getGroupedData();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }
    const uniqueKey = `fileProgress:${Date.now()}`;
    this.importService.parseAndValidate(file.path, uniqueKey);

    return { uniqueKey };
  }
}
