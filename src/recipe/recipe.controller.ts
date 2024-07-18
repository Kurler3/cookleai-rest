import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { JwtGuard } from 'src/auth/guard/jwt-auth.guard';
import { GetUser } from 'src/user/decorator/user.decorator';
import { User } from '@prisma/client';
import { GetPagination } from 'src/utils/decorators/pagination.decorator';
import { IPagination } from 'src/types';

@UseGuards(JwtGuard)
@Controller('recipes')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  @Post('create')
  create(
    @GetUser('id', ParseIntPipe) userId: number,
    @Body() createRecipeDto: CreateRecipeDto
  ) {
    return this.recipeService.create(userId, createRecipeDto);
  }

  @Get('my-recipes')
  findMyRecipes(
    @GetUser('id', ParseIntPipe) userId: number,
    @GetPagination() pagination?: IPagination,
  ) {
    return this.recipeService.findMyRecipes(userId, pagination);
  }


  // //TODO: Get public recipes
  // @Get()
  // findAll(@GetUser() user: User) {
  //   return this.recipeService.findAll();
  // }
  
  // Get detailed recipe data.
  @Get(':recipeId')
  findOne(
    @GetUser('id') userId: number,
    @Param('recipeId') recipeId: string,
  ) {
    return this.recipeService.findOne(userId, +recipeId);
  }

  //TODO: Update recipe
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRecipeDto: UpdateRecipeDto) {
    return this.recipeService.update(+id, updateRecipeDto);
  }

  //TODO: Delete recipe
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recipeService.remove(+id);
  }
}
