import { Test, TestingModule } from '@nestjs/testing';
import { CookbookController } from './cookbook.controller';
import { CookbookService } from './cookbook.service';

describe('CookbookController', () => {
  let controller: CookbookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CookbookController],
      providers: [CookbookService],
    }).compile();

    controller = module.get<CookbookController>(CookbookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
