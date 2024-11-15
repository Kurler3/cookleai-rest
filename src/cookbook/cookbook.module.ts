import { Module } from '@nestjs/common';
import { CookbookService } from './cookbook.service';
import { CookbookController } from './cookbook.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [CookbookController],
  providers: [CookbookService],
})
export class CookbookModule {}
