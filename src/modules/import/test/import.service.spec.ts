import { Test, TestingModule } from '@nestjs/testing';
import { ImportService } from '../import.service';
import { RedisService } from '../../redis/redis.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ImportRowEntity } from '../entity/import.row.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';

describe('ImportService - parseAndValidate', () => {
  let service: ImportService;
  let redisService: RedisService;
  let eventEmitter: EventEmitter2;
  let saveMock: jest.Mock;
  let createMock: jest.Mock;

  let mockWorkbook: ExcelJS.Workbook;
  let mockWorksheet: Partial<ExcelJS.Worksheet>;

  beforeEach(async () => {
    createMock = jest.fn((row) => row);
    saveMock = jest.fn((row) => Promise.resolve({ ...row, id: 1 }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportService,
        {
          provide: getRepositoryToken(ImportRowEntity),
          useValue: {
            create: createMock,
            save: saveMock,
          },
        },
        {
          provide: RedisService,
          useValue: {
            setParsingProgress: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ImportService>(ImportService);
    redisService = module.get<RedisService>(RedisService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    jest.spyOn(fs, 'writeFileSync').mockImplementation();
    jest.spyOn(path, 'join').mockReturnValue('mocked/path');
  });

  const mockExcelRows = (rows: any[]) => {
    mockWorksheet = {};
    Object.defineProperty(mockWorksheet, 'rowCount', { value: rows.length });

    mockWorksheet.getRow = (index: number) => {
      const row = rows[index - 1]; // Adjust to 0-based index
      return {
        worksheet: mockWorksheet,
        hasValues: true,
        values: [null, ...row], // Mock row values
        model: row,
        dimensions: { top: 0, left: 0, bottom: 0, right: 0 },
        getCell: (colIndex: number) => ({
          value: row[colIndex - 1], // 1-based index for Excel
        }),
        // Add other properties from ExcelJS.Row if necessary
      } as unknown as ExcelJS.Row; // Cast to the expected Row type
    };

    mockWorksheet.eachRow = function (...args: any[]) {
      const callback = args.length === 1 ? args[0] : args[1];
      rows.forEach((row, index) => {
        callback(
          {
            worksheet: mockWorksheet,
            hasValues: true,
            values: [null, ...row],
            model: row,
            dimensions: { top: 0, left: 0, bottom: 0, right: 0 },
            getCell: (colIndex: number) => ({
              value: row[colIndex - 1],
            }),
          } as unknown as ExcelJS.Row,
          index + 1,
        );
      });
    } as any;

    mockWorkbook = {
      xlsx: {
        readFile: jest.fn(),
      },
      worksheets: [mockWorksheet as ExcelJS.Worksheet],
    } as any;

    jest.spyOn(ExcelJS, 'Workbook').mockImplementation(() => mockWorkbook);
  };

  it('should process valid rows successfully', async () => {
    mockExcelRows([
      ['ID', 'Name', 'Date'], // header
      [1, 'Test Name', '01.01.2023'],
      [2, 'Test Name 2', '02.01.2023'],
    ]);

    const result = await service.parseAndValidate('test.xlsx', 'test-key');
    expect(result).toEqual({ successCount: 2, errorCount: 0 });
  });

  it('should handle validation errors', async () => {
    mockExcelRows([
      ['ID', 'Name', 'Date'],
      ['bad-id', '', 'invalid-date'],
    ]);

    const result = await service.parseAndValidate('test.xlsx', 'test-key');
    expect(result).toEqual({ successCount: 0, errorCount: 1 });
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      'mocked/path',
      expect.stringContaining('2 - '),
      'utf-8',
    );
  });

  it('should skip header row', async () => {
    mockExcelRows([
      ['ID', 'Name', 'Date'], // header
      [1, 'Test Name', '01.01.2023'],
    ]);

    const result = await service.parseAndValidate('test.xlsx', 'test-key');
    expect(result).toEqual({ successCount: 1, errorCount: 0 });
  });

  it('should handle empty file', async () => {
    mockExcelRows([
      ['ID', 'Name', 'Date'], // header only
    ]);

    const result = await service.parseAndValidate('test.xlsx', 'test-key');
    expect(result).toEqual({ successCount: 0, errorCount: 0 });
  });

  it('should process valid rows and log errors for invalid ones', async () => {
    mockExcelRows([
      ['ID', 'Name', 'Date'], // header
      [1, 'Valid Name', '01.01.2023'],
      ['bad-id', '', 'invalid-date'],
    ]);

    const result = await service.parseAndValidate('test.xlsx', 'test-key');
    expect(result).toEqual({ successCount: 1, errorCount: 1 });
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      'mocked/path',
      expect.stringContaining('3 - '),
      'utf-8',
    );
  });
});