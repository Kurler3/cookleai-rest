import { BadRequestException, forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ENV_VARS, RECIPE_ROLES } from 'src/utils/constants';
import { Prisma, Recipe, User, UsersOnRecipes } from '@prisma/client';
import { SupabaseService } from 'src/supabase/supabase.service';
import { v4 as uuid } from 'uuid';
import { GeminiService } from 'src/gemini/gemini.service';
import { QuotaService } from '../quota/quota.service';
import { IFindMyRecipesInput } from "../types/recipe.type";
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { AddMembersToRecipeDto } from './dto/add-members-to-recipe.dto';

@Injectable()
export class RecipeService {

  constructor(
    private prismaService: PrismaService,
    private supabaseService: SupabaseService,
    private geminiService: GeminiService,
    private quotaService: QuotaService,
    private configService: ConfigService,
    private userService: UserService,
  ) { }

  // Get all recipes for a given user
  async getUserRecipes(userId: number) {
    return this.findMyRecipes({ userId });
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

    if (quota.used >= quota.limit) {
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

        // Get the users and their role on this recipe.
        users: {
          select: {
            user: true,
            role: true,
          } 
        }
      }
    });

    // Generate pre signed url for recipe's image if has one and is private.
    if(!recipe.isPublic && recipe.imagePath) {

      recipe.imageUrl = await this.supabaseService.generatePreSignedUrl({
        bucket: this.configService.get(ENV_VARS.PRIVATE_IMAGES_BUCKET),
        path: recipe.imagePath,
      });

    }

    // Return the recipe, along with the role of this user in the recipe
    return { ...recipe, role };
  }

  // Delete recipe
  async remove(recipeId: number) {

    // Get the recipe's public status
    const {
      isPublic,
      imagePath,
    } = await this.prismaService.recipe.findUnique({
      where: {
        id: recipeId,
      },
      select: {
        imagePath: true,
        isPublic: true,
      }
    });

    await Promise.all([

      // Delete the recipe
      this.prismaService.recipe.delete({
        where: {
          id: recipeId,
        },
      }),

      // If there was an image attached to this recipe => delete it from storage.
      !!imagePath ? this.supabaseService.deleteFile(
        this.configService.get(isPublic ? ENV_VARS.PUBLIC_IMAGES_BUCKET : ENV_VARS.PRIVATE_IMAGES_BUCKET),
        imagePath
      ) : Promise.resolve("Success :D")
    ])



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

    const userRecipes = await Promise.all(
      userRecipePermissions.map(async (ur: UsersOnRecipes & { recipe: Recipe }) => {

        const recipe = ur.recipe;
  
        // if private and has an image => generate a pre signed url
        if(!recipe.isPublic && recipe.imagePath) {
  
          recipe.imageUrl = await this.supabaseService.generatePreSignedUrl({
            bucket: this.configService.get(ENV_VARS.PRIVATE_IMAGES_BUCKET),
            path: recipe.imagePath,
          });
          
        }
  
        return { 
          ...recipe, 
          role: ur.role, 
          addedAt: ur.addedAt 
        }
      })
    )

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
    if (('isPublic' in updateRecipeDto) && !!currentRecipe.imagePath && !('imageUrl' in updateRecipeDto)) {

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

    const bucket = this.configService.get(recipe.isPublic ? ENV_VARS.PUBLIC_IMAGES_BUCKET : ENV_VARS.PRIVATE_IMAGES_BUCKET) as string;

    if (recipe.imagePath) {

      await this.supabaseService.deleteFile(
        bucket,
        recipe.imagePath
      );

    }

    let {
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

    // Generate a pre-signed url if the recipe is private.
    if(!recipe.isPublic) {
      newImageUrl = await this.supabaseService.generatePreSignedUrl({
        bucket,
        path: newImagePath,
      });
    }

    return {
      data: newImageUrl,
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

    // Move file between buckets
    await this.supabaseService.moveFile({
      sourceBucket: this.configService.get(isPublic ? ENV_VARS.PRIVATE_IMAGES_BUCKET : ENV_VARS.PUBLIC_IMAGES_BUCKET),
      destinationBucket: this.configService.get(isPublic ? ENV_VARS.PUBLIC_IMAGES_BUCKET : ENV_VARS.PRIVATE_IMAGES_BUCKET),
      path: imagePath,
    });

    // If is public now => get the public imageUrl url
    if (isPublic) {
      publicImageUrl = await this.supabaseService.getFilePublicUrl({
        bucket: this.configService.get(ENV_VARS.PUBLIC_IMAGES_BUCKET),
        path: imagePath,
      });

      // Else the image url will be a signed url.
    } else {

      // Generate the image url!
      publicImageUrl = await this.supabaseService.generatePreSignedUrl({
        bucket: this.configService.get(ENV_VARS.PRIVATE_IMAGES_BUCKET),
        path: imagePath,
      })

    }

    // Returns optional public image url, depending on whether it's changing to public or to private.
    return {
      publicImageUrl,
    }
  }

  // Add members
  async addMembers(
    currentUserId: number,
    recipeId: number,
    body: AddMembersToRecipeDto,
  ) {

    // Start a transaction
    try {
      await this.prismaService.$transaction(async (tx) => {

        await Promise.all(
          body.members.map(async ({ role, userId }) => {

            // Assert not current user.
            this.userService.assertNotCurrentUser(
              currentUserId, 
              userId, 
              'You cannot edit yourself',
            );

            // Check if the user exists
            await this.userService.assertUserExists(tx, userId);
            
            // Get recipe permission for user being added to check if he already exists or not
            const recipePermission = await this.getRecipePermission(tx, recipeId, userId);

            if (!recipePermission) {

              // Create the membership record if the user is not already a member
              await tx.usersOnRecipes.create({
                data: {
                  recipe: {
                    connect: {
                      id: recipeId,
                    }
                  },
                  user: {
                    connect: {
                      id: userId,
                    }
                  },
                  role,
                  addedBy: currentUserId,
                },
              });
            }

          })
        )

      });

      // Return success message
      return { message: 'Members added successfully.' };

    } catch (error) {

      console.error('Error while adding members:', error);
      throw error;

    }


  }

  //TODO: Edit members

  //TODO: Remove members



  // Get the user's current role in the recipe, or throw an error if not a member
  private async getRecipePermission(
    tx: Prisma.TransactionClient,
    recipeId: number,
    userId: number,
    throwErrIfNoPermission?: boolean,
  ) {
    const permission = await tx.usersOnRecipes.findUnique({
      where: { recipeId_userId: { userId, recipeId } },
    });

    if (throwErrIfNoPermission && !permission) {
      throw new BadRequestException(`User with ID ${userId} is not a member of this recipeId`);
    }
    return permission;
  }
}
