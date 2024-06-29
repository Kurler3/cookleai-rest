import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { RecipeService } from '../recipe/recipe.service';

@Module({
  imports: [RecipeService],
  exports: [UserService],
  providers: [UserService],
})
export class UserModule {}
