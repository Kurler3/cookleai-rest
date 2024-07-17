import { Injectable } from '@nestjs/common';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RECIPE_ROLES } from 'src/utils/constants';
import { IPagination } from 'src/types';
import { Prisma, UsersOnRecipes } from '@prisma/client';
import { Recipe } from './entities/recipe.entity';

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
          role: RECIPE_ROLES.OWNER,
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
  async findMyRecipes(userId: number, pagination?: IPagination) {

    const queryParams: Prisma.UsersOnRecipesFindManyArgs = {
      where: {
        userId,
      },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            image: true,
            isPublic: true,
            createdAt: true,
            updatedAt: true,
            createdByUser: true,
          },
        },
      },
    }
    console.log({pagination})
    if(pagination) {
      queryParams.skip = pagination.page * pagination.limit;
      queryParams.take = pagination.limit;
    }
  
    const userRecipePermissions = await this.prismaService.usersOnRecipes.findMany(queryParams);

    const userRecipes = userRecipePermissions.map((ur: UsersOnRecipes & { recipe: Recipe }) => ({...ur.recipe, role: ur.role, addedAt: ur.addedAt}) );

    return userRecipes;

  }
}
