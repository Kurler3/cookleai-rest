import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { JwtGuard } from 'src/auth/guard/jwt-auth.guard';
import { GetUser } from 'src/user/decorator/user.decorator';
import { GetPagination } from 'src/utils/decorators/pagination.decorator';
import { IPagination } from 'src/types';
import { RecipeRolesGuard } from './guards/recipeRoles.guard';
import { RECIPE_ROLES } from 'src/utils/constants';
import { GetRole } from 'src/decorators/getRole.decorator';
import { FileTypesValidator } from 'src/utils/pipes/fileTypes.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { RecipeRoles } from 'src/decorators/RecipeRoles.decorator';
import { CreateRecipeWithAiDto } from './dto/create-recipe-with-ai.dto';
import { User } from '@prisma/client';

@UseGuards(JwtGuard)
@Controller('recipes')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  @Post('create')
  create(@GetUser() user: User, @Body() createRecipeDto: CreateRecipeDto) {
    return this.recipeService.create(user, createRecipeDto);
  }

  // Create with AI
  @Post('create-with-ai')
  createWithAI(
    @GetUser() user: User,
    @Body() { prompt }: CreateRecipeWithAiDto,
  ) {
    return this.recipeService.createWithAi(user, prompt);
  }

  @Get('my-recipes')
  findMyRecipes(
    @GetUser('id', ParseIntPipe) userId: number,
    @GetPagination() pagination?: IPagination,
    @Query('title') title?: string,
    @Query('cuisine') cuisine?: string,
    @Query('difficulty') difficulty?: string,
  ) {
    return this.recipeService.findMyRecipes({
      userId, 
      pagination,
      title,
      cuisine,
      difficulty,
    });
  }

  // Get detailed recipe data.
  @UseGuards(RecipeRolesGuard)
  @Get(':recipeId')
  findOne(@Param('recipeId') recipeId: string, @GetRole() role: string) {
    return this.recipeService.findOne(+recipeId, role);
  }

  // Delete recipe
  @UseGuards(RecipeRolesGuard)
  @RecipeRoles([RECIPE_ROLES.OWNER])
  @Delete(':recipeId')
  remove(@Param('recipeId') recipeId: string) {
    return this.recipeService.remove(+recipeId);
  }

  // Update recipe
  @UseGuards(RecipeRolesGuard)
  @RecipeRoles([RECIPE_ROLES.OWNER, RECIPE_ROLES.EDITOR])
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
  @UseGuards(RecipeRolesGuard)
  @RecipeRoles([RECIPE_ROLES.OWNER, RECIPE_ROLES.EDITOR])
  @UseInterceptors(FileInterceptor('img'))
  uploadImage(
    @Param('recipeId', ParseIntPipe) recipeId: number,
    @UploadedFile(
      new FileTypesValidator(),
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 1024 * 1024 * 200, // 200MB, 1MB = 1024 KB, 1KB = 1024 B
          }),
        ],
      }),
    )
    img: Express.Multer.File,
  ) {
    return this.recipeService.editRecipeImage(recipeId, img);
  }

  //TODO: Find public recipes (for explore page)
}
