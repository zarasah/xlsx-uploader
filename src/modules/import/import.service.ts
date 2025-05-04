import { Injectable } from '@nestjs/common';
import { RowDto } from "./dto/row.dto";
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { InjectRepository } from "@nestjs/typeorm";
import { ImportRowEntity } from "./entity/import.row.entity";
import { Repository } from "typeorm";
import { RedisService } from "../redis/redis.service";
import { GroupedDataDto } from "./dto/grouped.data.dto";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(ImportRowEntity) private readonly importRowRepository: Repository<ImportRowEntity>,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {
  }

  async getGroupedData(): Promise<GroupedDataDto[]> {
    const rows = await this.importRowRepository
      .createQueryBuilder('row')
      .select('row.date', 'date')
      .addSelect('json_agg(row)', 'items')
      .groupBy('row.date')
      .getRawMany();

    return plainToInstance(GroupedDataDto, rows, {
      excludeExtraneousValues: true,
    });
  }

  async parseAndValidate(filePath: string, uniqueKey: string) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    const validRows: RowDto[] = [];
    const errors: string[] = [];

    const totalRows = worksheet.rowCount;
    await this.redisService.setParsingProgress(uniqueKey, 0);

    for (let index = 2; index <= totalRows; index++) {
      const row = worksheet.getRow(index);
      const rowValues = Array.isArray(row.values) ? row.values : Object.values(row.values);
      const [id, name, date] = rowValues.slice(1);

      const dto: RowDto = plainToInstance(RowDto, { id, name, date });
      const validationErrors = validateSync(dto);

      if (validationErrors.length === 0) {
        validRows.push(dto);
      } else {
        const rowErrors = validationErrors
          .map((e) => Object.values(e.constraints || {}).join(', '))
          .join(', ');
        errors.push(`${index} - ${rowErrors}`);
      }

      await this.redisService.setParsingProgress(uniqueKey, index);
    }

    const resultPath = path.join(process.cwd(), 'result.txt');
    fs.writeFileSync(resultPath, errors.join('\n'), 'utf-8');

    for (const row of validRows) {
      const entity = this.importRowRepository.create(row);
      const newRow: ImportRowEntity = await this.importRowRepository.save(entity);
      this.eventEmitter.emit('rowCreated', newRow);
    }

    await this.redisService.setParsingProgress(uniqueKey, totalRows);

    return { successCount: validRows.length, errorCount: errors.length };
  }
}
