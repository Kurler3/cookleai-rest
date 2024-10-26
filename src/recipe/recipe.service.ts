import { Injectable, UnauthorizedException, UseFilters } from '@nestjs/common';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ENV_VARS, RECIPE_ROLES } from 'src/utils/constants';
import { IPagination } from 'src/types';
import { Prisma, Recipe, User, UsersOnRecipes } from '@prisma/client';
import { SupabaseService } from 'src/supabase/supabase.service';
import { v4 as uuid } from 'uuid';
import { GeminiService } from 'src/gemini/gemini.service';
import { QuotaService } from '../quota/quota.service';
import { IFindMyRecipesInput } from "../types/recipe.type";
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RecipeService {

  constructor(
    private prismaService: PrismaService,
    private supabaseService: SupabaseService,
    private geminiService: GeminiService,
    private quotaService: QuotaService,
    private configService: ConfigService,
  ) { }

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

  async create(user: User, createRecipeDto: CreateRecipeDto) {

    // Create a new recipe
    const newRecipe = await this.prismaService.recipe.create({
      data: {
        ...createRecipeDto,
        isPublic: false, //?? Not public by default
        createdByUser: {
          connect: {
            id: user.id,
          },
        },
        updatedByUser: {
          connect: {
            id: user.id,
          },
        }
      }
    });

    // Create ADMIn role for the user that created this recipe
    await this.prismaService.usersOnRecipes.create({
      data: {
        user: {
          connect: {
            id: user.id,
          }
        },
        recipe: {
          connect: {
            id: newRecipe.id,
          }
        },
        role: RECIPE_ROLES.OWNER,
        addedBy: user.id,
      }
    })

    return {
      ...newRecipe,
      createdByUser: user,
    };

  }

  // Create with ai
  async createWithAi(user: User, prompt: string) {

    // Check quota.
    const quota = await this.quotaService.getQuotaByType(user.id, "AI");

    if(quota.used >= quota.limit) {
      throw new UnauthorizedException('You have exceeded your AI quota. Please try again tomorrow.');
    }

    const recipeCreateDto = await this.geminiService.generateRecipeFromPrompt(prompt);

    // Increment quota.
    await this.quotaService.incrementQuota(user.id, 'AI', 1);

    return await this.create(user, recipeCreateDto);
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
      include: {
        createdByUser: true,
      }
    });

    //TODO - Generate pre signed url for recipe's image if has one.


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

    //TODO Remove image from storage if attached.

    return {
      message: 'Recipe deleted successfully'
    }
  }


  // Get user recipes
  async findMyRecipes({
    userId, 
    pagination,
    title,
    cuisine,
    difficulty
  }: IFindMyRecipesInput) {

    const whereFilter: Prisma.UsersOnRecipesWhereInput = {
      userId,
      recipe: {
        ...(title && { title: { contains: title } }),
        ...(cuisine && { cuisine: { equals: cuisine } }),
        ...(difficulty && { difficulty: { equals: difficulty } }),
      },
    };

    const queryParams: Prisma.UsersOnRecipesFindManyArgs = {
      where: whereFilter,
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            imagePath: true,
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

    //TODO - For every recipe, if private and has an image => generate a pre signed url

    return userRecipes;

  }

  // Update recipe
  async update(
    recipeId: number,
    updateRecipeDto: UpdateRecipeDto,
    role: string,
  ) {

    // Init a final recipe update object in order to further update some keys depending on the update the user wants to make.
    // Making imagePath null depending on whether the user wants to reset the recipe's image is an example.
    const finalRecipeUpdateObject: Partial<Recipe> = { ...updateRecipeDto };

    // Get current recipe image (before updating)
    const currentRecipe = await this.prismaService.recipe.findUnique({
      where: {
        id: recipeId,
      },
      select: {
        imagePath: true,
        isPublic: true,
      }
    });

    // If reset the image => delete from storage.
    if ('imageUrl' in updateRecipeDto && updateRecipeDto.imageUrl === null) {

      // If had an image prior to resetting it => delete it from storage.
      if (currentRecipe.imagePath) {

        // Delete the image.
        await this.supabaseService.deleteFile(
          this.configService.get(currentRecipe.isPublic ? ENV_VARS.PUBLIC_IMAGES_BUCKET : ENV_VARS.PRIVATE_IMAGES_BUCKET),
          currentRecipe.imagePath,
        );

        // Set the new image path to null.
        finalRecipeUpdateObject.imagePath = null;

      }

    }

    // If changing the isPublic key and there's an imageUrl attached and not making imageUrl null => change the place of the image in storage
    if(('isPublic' in updateRecipeDto) && !!currentRecipe.imagePath && !('imageUrl' in updateRecipeDto)) {

      // Change the image place depending on whether the isPublic is now true or false. 
      const {
        publicImageUrl 
      } = await this.changeRecipeImageVisibility({
        isPublic: updateRecipeDto.isPublic,
        imagePath: currentRecipe.imagePath,
      });

      // publicImageUrl could be either null or an actual url, depending on which visibility status the recipe is changing to.
      finalRecipeUpdateObject.imageUrl = publicImageUrl;

    }

    // Update the recipe.
    const updatedRecipe = await this.prismaService.recipe.update({
      where: {
        id: recipeId,
      },
      data: finalRecipeUpdateObject,
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

    const bucket = this.configService.get(recipe.isPublic ? ENV_VARS.PUBLIC_IMAGES_BUCKET : ENV_VARS.PRIVATE_IMAGES_BUCKET)

    if (recipe.imagePath) {

      await this.supabaseService.deleteFile(
        bucket, 
        recipe.imagePath
      );

    }

    const {
      publicUrl: newImageUrl,
      filePath: newImagePath,
    } = await this.supabaseService.uploadFile(
      bucket,
      img,
      `/recipes/${recipeId}/${uuid()}`,
      recipe.isPublic,
    );

    console.log('file path: ', newImagePath, newImageUrl);

    // Update the recipe
    await this.prismaService.recipe.update({
      where: {
        id: recipeId,
      },
      data: {
        imageUrl: newImageUrl,
        imagePath: newImagePath,
      },
    });

    return {
      data: newImageUrl ?? null,
    }
  }

  // Function to change recipe image visibility
  async changeRecipeImageVisibility({
    isPublic, // If is going to be public or not
    imagePath,
  }: {
    isPublic: boolean;
    imagePath: string;
  }) {

    let publicImageUrl: string | null;

    console.log({imagePath})

    // Move file between buckets
    await this.supabaseService.moveFile({
      sourceBucket: isPublic ? ENV_VARS.PRIVATE_IMAGES_BUCKET : ENV_VARS.PUBLIC_IMAGES_BUCKET,
      destinationBucket: isPublic ? ENV_VARS.PUBLIC_IMAGES_BUCKET : ENV_VARS.PRIVATE_IMAGES_BUCKET,
      path: imagePath,
    });

    // If is public now => get the public imageUrl url
    if(isPublic) {
      publicImageUrl = await this.supabaseService.getFilePublicUrl({
        bucket: ENV_VARS.PRIVATE_IMAGES_BUCKET,
        path: imagePath,
      });

    // Else the image url will be null.
    } else {
      publicImageUrl = null;
    }

    // Returns optional public image url, depending on whether it's changing to public or to private.
    return {
      publicImageUrl,
    }
  }

  // Function to generate pre signed url for a given recipe image path.
}
