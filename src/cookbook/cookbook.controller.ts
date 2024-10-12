import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
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

  //TODO Remove recipe from cookbook
  
  // //TODO
  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateCookbookDto: UpdateCookbookDto) {
  //   return this.cookbookService.update(+id, updateCookbookDto);
  // }

  // //TODO
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.cookbookService.remove(+id);
  // }

}
