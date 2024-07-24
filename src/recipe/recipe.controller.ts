import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { JwtGuard } from 'src/auth/guard/jwt-auth.guard';
import { GetUser } from 'src/user/decorator/user.decorator';
import { User } from '@prisma/client';
import { GetPagination } from 'src/utils/decorators/pagination.decorator';
import { IPagination } from 'src/types';
import { RecipeRolesGuard } from './guards/recipeRoles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { RECIPE_ROLES } from 'src/utils/constants';
import { GetRole } from 'src/decorators/getRole.decorator';

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
  
  // Get detailed recipe data.
  @UseGuards(RecipeRolesGuard)
  @Get(':recipeId')
  findOne(
    @Param('recipeId') recipeId: string,
    @GetRole() role: string,
  ) {
    return this.recipeService.findOne(+recipeId, role);
  }

  // Delete recipe
  @UseGuards(RecipeRolesGuard)
  @Roles([RECIPE_ROLES.OWNER])
  @Delete(':recipeId')
  remove(
    @Param('recipeId') recipeId: string,
  ) {
    return this.recipeService.remove(+recipeId);
  }

  // Update recipe
  @UseGuards(RecipeRolesGuard)
  @Roles([RECIPE_ROLES.OWNER, RECIPE_ROLES.EDITOR])
  @Patch(':recipeId')
  update(
    @Param('recipeId') recipeId: string, 
    @Body() updateRecipeDto: UpdateRecipeDto,
    @GetRole() role: string,
  ) {
    return this.recipeService.update(+recipeId, updateRecipeDto, role);
  }

  // Upload image
  @Post(':recipeId/upload-image')

  //TODO: Find public recipes (for explore page)
}
