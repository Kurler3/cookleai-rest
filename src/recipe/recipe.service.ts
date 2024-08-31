import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RECIPE_ROLES } from 'src/utils/constants';
import { IPagination } from 'src/types';
import { Prisma, Recipe, UsersOnRecipes } from '@prisma/client';
import { SupabaseService } from 'src/supabase/supabase.service';
import { v4 as uuid } from 'uuid';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ConfigService } from '@nestjs/config';
import { GeminiService } from 'src/gemini/gemini.service';

@Injectable()
export class RecipeService {

  constructor(
    private prismaService: PrismaService,
    private supabaseService: SupabaseService,
    private geminiService: GeminiService,
  ) { }

  getRecipeImageKey(recipeImage: string) {
    return recipeImage.split('/').slice(recipeImage.split('/').length - 3,).join('/');
  }

  async updateRecipe(
    recipeId: number,
    updateRecipeDto: UpdateRecipeDto,
  ) {
    return await this.prismaService.recipe.update({
      where: {
        id: recipeId,
      },
      data: updateRecipeDto,
    });
  }

  async create(userId: number, createRecipeDto: CreateRecipeDto) {

    // Create a new recipe
    const newRecipe = await this.prismaService.recipe.create({
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

  // Create with ai
  async createWithAi(userId: number, prompt: string) {
    const recipeCreateDto = await this.geminiService.generateRecipeFromPrompt(prompt);
    return await this.create(userId, recipeCreateDto);
  }

  async getUserRoleOnRecipe(userId: number, recipeId: number) {
    const userPermission = await this.prismaService.usersOnRecipes.findFirst({
      where: {
        userId,
        recipeId,
      },
    });

    if (!userPermission) {
      throw new UnauthorizedException('You do not have permission to view this recipe');
    }

    return userPermission.role;
  }

  // Find recipe
  async findOne(recipeId: number, role: string) {

    // Get the recipe
    const recipe = await this.prismaService.recipe.findUnique({
      where: {
        id: recipeId,
      },
    });

    // Return the recipe, along with the role of this user in the recipe
    return { ...recipe, role };
  }

  // Delete recipe
  async remove(recipeId: number) {

    await this.prismaService.recipe.delete({
      where: {
        id: recipeId,
      },
    });

    return {
      message: 'Recipe deleted successfully'
    }
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
      // Order by time of creation of the recipe, from newest to oldest.
      orderBy: {
        recipe: {
          createdAt: 'desc',
        }
      }
    }

    if (pagination) {
      queryParams.skip = pagination.page * pagination.limit;
      queryParams.take = pagination.limit;
    }

    const userRecipePermissions = await this.prismaService.usersOnRecipes.findMany(queryParams);

    const userRecipes = userRecipePermissions.map((ur: UsersOnRecipes & { recipe: Recipe }) => ({ ...ur.recipe, role: ur.role, addedAt: ur.addedAt }));

    return userRecipes;

  }

  // Update recipe
  async update(
    recipeId: number,
    updateRecipeDto: UpdateRecipeDto,
    role: string,
  ) {

    // If reset the image => delete from storage.
    if (updateRecipeDto.image === null) {

      // Get current recipe image (before updating)
      const currentRecipe = await this.prismaService.recipe.findUnique({
        where: {
          id: recipeId,
        },
        select: {
          image: true,
        }
      });

      // If had an image prior to resetting it => delete it from storage.
      if (currentRecipe.image) {

        const imageKey = this.getRecipeImageKey(currentRecipe.image);

        await this.supabaseService.deleteFile(imageKey);

      }

    }

    const updatedRecipe = await this.prismaService.recipe.update({
      where: {
        id: recipeId,
      },
      data: updateRecipeDto,
      include: {
        createdByUser: true,
      }
    });

    return {
      ...updatedRecipe,
      role,
    }

  }


  // Edit recipe image
  async editRecipeImage(
    recipeId: number,
    img: Express.Multer.File,
  ) {

    const recipe = await this.prismaService.recipe.findUnique({
      where: {
        id: recipeId,
      }
    });

    if (recipe.image) {

      const imageKey = recipe.image.split('/').slice(recipe.image.split('/').length - 3,).join('/');

      await this.supabaseService.deleteFile(imageKey)
    }

    const newImageUrl = await this.supabaseService.uploadFile(
      img,
      `/recipes/${recipeId}/${uuid()}`,
    );
    // Update the recipe.
    await this.updateRecipe(
      recipeId,
      {
        image: newImageUrl,
      }
    )

    return {
      data: newImageUrl,
    }
  }

}
