import { Test, TestingModule } from '@nestjs/testing';
import { ImportController } from '../import.controller';
import { ImportService } from '../import.service';

describe('ImportController', () => {
  let controller: ImportController;
  let service: ImportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImportController],
      providers: [
        {
          provide: ImportService,
          useValue: {
            getGroupedData: jest.fn().mockResolvedValue([
              {
                date: '2024-01-01',
                items: [{ id: 1, name: 'test', date: '2024-01-01' }],
              },
            ]),
          },
        },
      ],
    }).compile();

    controller = module.get<ImportController>(ImportController);
    service = module.get<ImportService>(ImportService);
  });

  it('should return grouped data', async () => {
    const result = await controller.getGroupedData();
    expect(result).toEqual([
      {
        date: '2024-01-01',
        items: [{ id: 1, name: 'test', date: '2024-01-01' }],
      },
    ]);
  });
});
