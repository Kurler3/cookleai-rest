import { Test, TestingModule } from '@nestjs/testing';
import { CookbookService } from './cookbook.service';

describe('CookbookService', () => {
  let service: CookbookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CookbookService],
    }).compile();

    service = module.get<CookbookService>(CookbookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
