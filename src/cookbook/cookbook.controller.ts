import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CookbookService } from './cookbook.service';
import { GetUser } from 'src/user/decorator/user.decorator';
import { GetPagination } from 'src/utils/decorators/pagination.decorator';
import { IPagination, ISelection } from 'src/types';
import { GetSelection } from 'src/utils/decorators/selector.decorator';
import { GetSearchTerm } from 'src/utils/decorators/search.decorator';
import { CreateCookbookDto } from './dto/create-cookbook.dto';
import { JwtGuard } from 'src/auth/guard/jwt-auth.guard';
import { CookbookRolesGuard } from './guards/cookbookRoles.guard';
import { COOKBOOK_ROLES, RECIPE_ROLES } from 'src/utils/constants';
import { RecipeRolesGuard } from 'src/recipe/guards/recipeRoles.guard';
import { RecipeRoles } from 'src/decorators/RecipeRoles.decorator';
import { CookbookRoles } from 'src/decorators/CookbookRoles.decorator';
import { GetRole } from '../decorators/getRole.decorator';
import { UpdateCookbookDto } from './dto/update-cookbook.dto';
import { AddMembersDto } from './dto/add-members.dto';

@UseGuards(JwtGuard)
@Controller('cookbooks')
export class CookbookController {
  constructor(private readonly cookbookService: CookbookService) {}

  @Post('create')
  create(
    @GetUser('id') userId: number,
    @Body() createCookbookDto: CreateCookbookDto,
  ) {
    return this.cookbookService.create(userId, createCookbookDto);
  }

  @Get('my-cookbooks')
  getMyCookbooks(
    @GetUser('id') userId: number,
    @GetPagination() pagination?: IPagination,
    @GetSelection() selection?: ISelection,
    @GetSearchTerm() search?: string,
    @Query('excludedRecipeId', new ParseIntPipe({ optional: true })) excludedRecipeId?: number,
  ) {
    return this.cookbookService.getMyCookbooks(
      userId, 
      pagination,
      selection,
      search,
      excludedRecipeId,
    );
  }

  // Add recipe to cookbook
  @UseGuards(CookbookRolesGuard, RecipeRolesGuard)
  @CookbookRoles([COOKBOOK_ROLES.OWNER, COOKBOOK_ROLES.EDITOR])
  @RecipeRoles([RECIPE_ROLES.OWNER, RECIPE_ROLES.EDITOR])
  @Post(':cookbookId/recipes/:recipeId')
  addRecipeToCookbook(
    @Param('cookbookId', ParseIntPipe) cookbookId: number,
    @Param('recipeId', ParseIntPipe) recipeId: number,
  ) {
    return this.cookbookService.addRecipeToCookbook(cookbookId, recipeId);
  }

  // Get a cookbook
  @UseGuards(CookbookRolesGuard)
  @CookbookRoles([COOKBOOK_ROLES.OWNER, COOKBOOK_ROLES.EDITOR, COOKBOOK_ROLES.VIEWER])
  @Get(':cookbookId')
  findOne(
    @Param('cookbookId') cookbookId: string,
    @GetRole() role: string,
  ) {
    return this.cookbookService.findOne(
      +cookbookId,
      role,
    );
  }

  // Update a cookbook
  @UseGuards(CookbookRolesGuard)
  @CookbookRoles([COOKBOOK_ROLES.OWNER, COOKBOOK_ROLES.EDITOR])
  @Patch(':cookbookId')
  update(
    @Param("cookbookId") cookbookId: string,
    @Body() updateCookbookDto: UpdateCookbookDto,
  ) {
    return this.cookbookService.update(
      +cookbookId,
      updateCookbookDto,
    );
  }

  // Delete cookbook
  @UseGuards(CookbookRolesGuard)
  @CookbookRoles([COOKBOOK_ROLES.OWNER])
  @Delete(':cookbookId')
  delete(
    @Param('cookbookId') cookbookId: string,
  ) {
    return this.cookbookService.delete(+cookbookId)
  }

  // Leave cookbook
  @UseGuards(CookbookRolesGuard)
  @CookbookRoles([COOKBOOK_ROLES.EDITOR, COOKBOOK_ROLES.VIEWER])
  @Post('/leave/:cookbookId')
  leaveCookbook(
    @Param('cookbookId') cookbookId: string,
    @GetUser('id') userId: number,
  ) {
    return this.cookbookService.leave(
      +cookbookId,
      userId,
    );
  } 

  // Add members
  @UseGuards(CookbookRolesGuard)
  @CookbookRoles([COOKBOOK_ROLES.OWNER])
  @Post(':cookbookId/add-members')
  addMembers(
    @GetUser('id') currentUserId: number,
    @Param('cookbookId') cookbookId: string,
    @Body() body: AddMembersDto,
  ) {
    return this.cookbookService.addMembers(
      currentUserId,
      +cookbookId,
      body,
    );
  }

  // Get recipes for the cookbook
  @UseGuards(CookbookRolesGuard)
  @CookbookRoles([COOKBOOK_ROLES.OWNER, COOKBOOK_ROLES.EDITOR, COOKBOOK_ROLES.VIEWER])
  @Get('/:cookbookId/recipes')
  getCookbookRecipes(
    @GetPagination() pagination?: IPagination,
    @Query('title') title?: string,
    @Query('cuisine') cuisine?: string,
    @Query('difficulty') difficulty?: string,
    @GetRole() cookbookRole?: string,
    @GetUser('id') userId?: number,
    @Param('cookbookId', ParseIntPipe) cookbookId?: number
  ) {
    return this.cookbookService.getCookbookRecipes({
      pagination,
      title,
      cuisine,
      difficulty,
      cookbookRole,
      userId,
      cookbookId,
    });
  }

  //TODO Remove recipe from cookbook
  
}
