import { Injectable } from '@nestjs/common';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RECIPE_ROLES } from 'src/utils/constants';

@Injectable()
export class RecipeService {

  constructor(private prismaService: PrismaService) {}

  async create(userId: number, createRecipeDto: CreateRecipeDto) {

    // Create a new recipe
    const newRecipe =  await this.prismaService.recipe.create({
      data: {
        ...createRecipeDto,
        isPublic: false, //?? Not public by default
        createdByUser: {
          connect: {
            id: userId,
          },
        },
        updatedByUser: {
          connect: {
            id: userId,
          },
        }
      }
    });

    // Create ADMIn role for the user that created this recipe
    await this.prismaService.usersOnRecipes.create({
        data: {
          user: {
            connect: {
              id: userId,
            }
          },
          recipe: {
            connect: {
              id: newRecipe.id,
            }
          },
          role: RECIPE_ROLES.ADMIN,
          addedBy: userId,
        }
    })

    return newRecipe;

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
