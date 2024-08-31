import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { RecipeModule } from 'src/recipe/recipe.module';
import { QuotaModule } from 'src/quota/quota.module';

@Module({
  imports: [RecipeModule, QuotaModule],
  exports: [UserService],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
