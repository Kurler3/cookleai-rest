import { Module } from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { RecipeController } from './recipe.controller';
import { QuotaModule } from 'src/quota/quota.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [QuotaModule, UserModule],
  controllers: [RecipeController],
  providers: [RecipeService],
  exports: [RecipeService]
})
export class RecipeModule {}
