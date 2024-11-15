import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { QuotaModule } from 'src/quota/quota.module';

@Module({
  imports: [QuotaModule],
  exports: [UserService],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
