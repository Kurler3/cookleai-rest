import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RECIPE_ROLES } from 'src/utils/constants';
import { IPagination } from 'src/types';
import { Prisma, Recipe, UsersOnRecipes } from '@prisma/client';
import { SupabaseService } from 'src/supabase/supabase.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class RecipeService {

  constructor(
    private prismaService: PrismaService,
    private supabaseService: SupabaseService,
  ) {}


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

  async getUserRoleOnRecipe(userId: number, recipeId: number) {
    const userPermission = await this.prismaService.usersOnRecipes.findFirst({
      where: {
        userId,
        recipeId,
      },
    });

    if(!userPermission) {
      throw new UnauthorizedException('You do not have permission to view this recipe');
    }

    return userPermission.role;
  }

  async findOne(recipeId: number, role: string) {

    // Get the recipe
    const recipe = await this.prismaService.recipe.findUnique({
      where: {
        id: recipeId,
      },
    });

    // Return the recipe, along with the role of this user in the recipe
    return {...recipe, role};
  }

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
    }
   
    if(pagination) {
      queryParams.skip = pagination.page * pagination.limit;
      queryParams.take = pagination.limit;
    }
  
    const userRecipePermissions = await this.prismaService.usersOnRecipes.findMany(queryParams);

    const userRecipes = userRecipePermissions.map((ur: UsersOnRecipes & { recipe: Recipe }) => ({...ur.recipe, role: ur.role, addedAt: ur.addedAt}) );

    return userRecipes;

  }

  // Update
  async update(
    recipeId: number, 
    updateRecipeDto: UpdateRecipeDto,
    role: string,
  ) {

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

    // Get the recipe
    const recipe = await this.prismaService.recipe.findUnique({
      where: {
        id: recipeId,
      },
    });

    // If there was a previous image on the recipe => delete it.
    if(recipe.image) {

      //TODO: May need to extract the key from the public url

      await this.supabaseService.deleteFile(recipe.image);
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
      message: 'New image uploaded successfully!'
    }
  }

}
