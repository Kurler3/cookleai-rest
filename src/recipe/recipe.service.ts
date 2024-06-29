import { Injectable } from '@nestjs/common';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecipeService {

  constructor(private prismaService: PrismaService) {}

  create(createRecipeDto: CreateRecipeDto) {
    return 'This action adds a new recipe';
  }

  findAll() {
    return `This action returns all recipe`;
  }

  findOne(id: number) {
    return `This action returns a #${id} recipe`;
  }

  update(id: number, updateRecipeDto: UpdateRecipeDto) {
    return `This action updates a #${id} recipe`;
  }

  remove(id: number) {
    return `This action removes a #${id} recipe`;
  }


  // Get user recipes
  async getUserRecipes(userId: number) {

    const userRecipePermissions = await this.prismaService.usersOnRecipes.findMany({
      where: {
        userId,
      },
      include: {
        recipe: true,
      },
    });

    const userRecipes = userRecipePermissions.map((ur) => ur.recipe);

    return userRecipes;

  }
}
