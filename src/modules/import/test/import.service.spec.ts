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

    mockWorksheet.eachRow = function (...args: any[]) {
      const callback = args.length === 1 ? args[0] : args[1];
      rows.forEach((row, index) => {
        callback({ values: [null, ...row] }, index + 1);
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



// import { ImportService } from './import.service';
// import { ImportRowEntity } from './entity/import.row.entity';
// import { RedisService } from '../redis/redis.service';
// import { EventEmitter2 } from '@nestjs/event-emitter';
// import * as fs from 'fs';
// import * as path from 'path';
// import * as ExcelJS from 'exceljs';
//
// describe('parseAndValidate', () => {
//   let service: ImportService;
//   let redisService: { setParsingProgress: jest.Mock };
//   let eventEmitter: { emit: jest.Mock };
//   let createMock: jest.Mock;
//   let saveMock: jest.Mock;
//   let importRowRepository: { create: jest.Mock; save: jest.Mock };
//   let mockWorkbook: ExcelJS.Workbook;
//   let mockWorksheet: Partial<ExcelJS.Worksheet>;
//
//   beforeEach(() => {
//     redisService = { setParsingProgress: jest.fn() };
//     eventEmitter = { emit: jest.fn() };
//     createMock = jest.fn((row) => row);
//     saveMock = jest.fn((row) => Promise.resolve({ ...row, id: 1 }));
//     importRowRepository = {
//       create: createMock,
//       save: saveMock,
//     } as any;
//
//     jest.spyOn(ExcelJS, 'Workbook').mockImplementation(() => mockWorkbook);
//     jest.spyOn(fs, 'writeFileSync').mockImplementation();
//     jest.spyOn(path, 'join').mockReturnValue('mocked/path');
//
//     service = new ImportService(
//       importRowRepository as any,
//       redisService as any,
//       eventEmitter as any
//     );
//   });
//
//   it('should process valid rows successfully', async () => {
//     // Header + 2 valid data rows
//     mockWorksheet = {};
//     Object.defineProperty(mockWorksheet, 'rowCount', { value: 3 });
//     mockWorksheet.eachRow = function (...args: any[]) {
//       let callback: (row: any, rowNumber: number) => void;
//       if (args.length === 1) {
//         callback = args[0];
//       } else {
//         callback = args[1];
//       }
//       callback({ values: [null, 'ID', 'Name', 'Date'] }, 1); // header
//       callback({ values: [null, 1, 'Test Name', '01.01.2023'] }, 2);
//       callback({ values: [null, 2, 'Test Name 2', '02.01.2023'] }, 3);
//     } as any;
//
//     mockWorkbook = {
//       xlsx: {
//         readFile: jest.fn(),
//       },
//       worksheets: [mockWorksheet as ExcelJS.Worksheet],
//     } as any;
//
//     const result = await service.parseAndValidate('test.xlsx', 'test-key');
//
//     expect(result).toEqual({
//       successCount: 2,
//       errorCount: 0,
//     });
//   });
//
//   it('should handle validation errors', async () => {
//     mockWorksheet = {};
//     Object.defineProperty(mockWorksheet, 'rowCount', { value: 2 });
//     mockWorksheet.eachRow = function (...args: any[]) {
//       let callback: (row: any, rowNumber: number) => void;
//       if (args.length === 1) {
//         callback = args[0];
//       } else {
//         callback = args[1];
//       }
//       callback({ values: [null, 'invalid-id', '', 'invalid-date'] }, 2);
//     } as any;
//
//     mockWorkbook = {
//       xlsx: {
//         readFile: jest.fn(),
//       },
//       worksheets: [mockWorksheet as ExcelJS.Worksheet],
//     } as any;
//
//     const result = await service.parseAndValidate('test.xlsx', 'test-key');
//
//     expect(result).toEqual({
//       successCount: 0,
//       errorCount: 1,
//     });
//
//     expect(fs.writeFileSync).toHaveBeenCalledWith(
//       'mocked/path',
//       expect.stringContaining('2 - '),
//       'utf-8'
//     );
//   });
//
//   it('should skip header row', async () => {
//     mockWorksheet = {};
//     Object.defineProperty(mockWorksheet, 'rowCount', { value: 2 });
//     mockWorksheet.eachRow = function (...args: any[]) {
//       let callback: (row: any, rowNumber: number) => void;
//       if (args.length === 1) {
//         callback = args[0];
//       } else {
//         callback = args[1];
//       }
//       callback({ values: [null, 'ID', 'Name', 'Date'] }, 1);
//       callback({ values: [null, 1, 'Test Name', '01.01.2023'] }, 2);
//     } as any;
//
//     mockWorkbook = {
//       xlsx: {
//         readFile: jest.fn(),
//       },
//       worksheets: [mockWorksheet as ExcelJS.Worksheet],
//     } as any;
//
//     const result = await service.parseAndValidate('test.xlsx', 'test-key');
//
//     expect(result).toEqual({
//       successCount: 1,
//       errorCount: 0,
//     });
//   });
//
//   it('should handle empty file', async () => {
//     mockWorksheet = {};
//     Object.defineProperty(mockWorksheet, 'rowCount', { value: 1 });
//     mockWorksheet.eachRow = function (...args: any[]) {
//       // No rows
//     } as any;
//
//     mockWorkbook = {
//       xlsx: {
//         readFile: jest.fn(),
//       },
//       worksheets: [mockWorksheet as ExcelJS.Worksheet],
//     } as any;
//
//     const result = await service.parseAndValidate('test.xlsx', 'test-key');
//
//     expect(result).toEqual({
//       successCount: 0,
//       errorCount: 0,
//     });
//   });
//
//   it('should process valid rows and log errors for invalid ones', async () => {
//     mockWorksheet = {};
//     Object.defineProperty(mockWorksheet, 'rowCount', { value: 3 });
//
//     mockWorksheet.eachRow = function (...args: any[]) {
//       let callback: (row: any, rowNumber: number) => void;
//       if (args.length === 1) {
//         callback = args[0];
//       } else {
//         callback = args[1];
//       }
//
//       callback({ values: [null, 'ID', 'Name', 'Date'] }, 1); // header
//       callback({ values: [null, 1, 'Valid Name', '01.01.2023'] }, 2); // valid
//       callback({ values: [null, 'bad-id', '', 'invalid-date'] }, 3); // invalid
//     } as any;
//
//     mockWorkbook = {
//       xlsx: {
//         readFile: jest.fn(),
//       },
//       worksheets: [mockWorksheet as ExcelJS.Worksheet],
//     } as any;
//
//     const result = await service.parseAndValidate('test.xlsx', 'test-key');
//
//     expect(result).toEqual({
//       successCount: 1,
//       errorCount: 1,
//     });
//
//     expect(saveMock).toHaveBeenCalledTimes(1);
//     expect(fs.writeFileSync).toHaveBeenCalledWith(
//       'mocked/path',
//       expect.stringContaining('3 - '), // Error line
//       'utf-8'
//     );
//   });
//
// });