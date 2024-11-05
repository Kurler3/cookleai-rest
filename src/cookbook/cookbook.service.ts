import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCookbookDto } from './dto/create-cookbook.dto';
import { IPagination, ISelection } from 'src/types';
import { CookBook, CookBookToRecipes, Prisma, Recipe, UsersOnCookBooks } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { COOKBOOK_ROLES, ENV_VARS } from 'src/utils/constants';
import { UpdateCookbookDto } from './dto/update-cookbook.dto';
import { SupabaseService } from '../supabase/supabase.service';
import { ConfigService } from '@nestjs/config';
import { AddMembersDto } from './dto/add-members.dto';
import { IGetCookbookRecipesInput } from '../types/cookbook.types';

@Injectable()
export class CookbookService {


  constructor(
    private prismaService: PrismaService,
    private supabaseService: SupabaseService,
    private configService: ConfigService,
  ) { }

  // Add recipe to cookbook.
  async addRecipeToCookbook(
    cookbookId: number,
    recipeId: number
  ) {

    // Check whether this recipe is already in the cookbook.
    const recipe = await this.prismaService.recipe.findUnique({
      where: {
        id: recipeId
      },
      include: {
        cookbooks: true
      }
    });

    const isRecipeInCookbook = recipe.cookbooks.find((cookbookRelationship) => {
      return cookbookRelationship.cookbookId === cookbookId;
    });

    if (isRecipeInCookbook) {
      throw new BadRequestException('Recipe is already in the cookbook');
    }

    // If not, then create a new item on CookbookToRecipes.
    await this.prismaService.cookBookToRecipes.create({
      data: {
        cookbook: {
          connect: {
            id: cookbookId
          }
        },
        recipe: {
          connect: {
            id: recipeId
          }
        }
      }
    });

    return {
      message: 'Recipe added to cookbook successfully'
    }

  }

  async create(userId: number, createCookbookDto: CreateCookbookDto) {

    // Create a cookbook
    const cookbook = await this.prismaService.cookBook.create({
      data: {
        ...createCookbookDto,
        createdByUser: {
          connect: {
            id: userId,
          },
        },
        updatedByUser: {
          connect: {
            id: userId,
          },
        },
      }
    });

    // Create a permission on the cookbook
    await this.prismaService.usersOnCookBooks.create({
      data: {
        user: {
          connect: { id: userId },
        },
        cookbook: {
          connect: { id: cookbook.id },
        },
        role: COOKBOOK_ROLES.OWNER,
        addedBy: userId,
      }
    });

    return { ...cookbook, role: COOKBOOK_ROLES.OWNER };

  }

  async getMyCookbooks(
    userId: number,
    pagination?: IPagination,
    cookbookSelection?: ISelection,
    search?: string,
    excludedRecipeId?: number,
  ) {

    const queryParams: Prisma.UsersOnCookBooksFindManyArgs = {
      where: {
        userId,
        cookbook: {
          AND: [
            search ? {
              title: {
                contains: search,
                mode: 'insensitive',
              },
            } : {},
            excludedRecipeId ? {
              recipes: {
                none: {
                  recipeId: excludedRecipeId,
                },
              },
            } : {},
          ],
        },
      },
      include: {
        cookbook: {

          select: {

            // -----------------
            // Select the info for the cookbook
            ...(cookbookSelection ? {
              ...cookbookSelection,
              id: true,
            } : {
              id: true,
              title: true,
              image: true,
              isPublic: true,
              createdAt: true,
              updatedAt: true,
              createdByUser: true,
            }),

            // ----------------

            // ----------------
            // Get count of recipes on cookbook
            _count: {
              select: {
                recipes: true, // This will give you the count of recipes in the cookbook.
              },
            },

            // -------------

            // ----------------
            // Get the first recipe image.
            recipes: {
              take: 1, // Get only the first recipe
              orderBy: {
                recipe: {
                  createdAt: 'asc',
                }
              },
              include: {
                recipe: {
                  select: {
                    imageUrl: true,
                    imagePath: true,
                    isPublic: true,
                  }
                }
              }
            },

            // ------------

          },
        },
      },
    }

    if (pagination) {
      queryParams.skip = pagination.page * pagination.limit;
      queryParams.take = pagination.limit;
    }

    const userCookbookPermissions = await this.prismaService.usersOnCookBooks.findMany(queryParams);

    const userCookbooks = await Promise.all(
      userCookbookPermissions.map(
        async (ur: UsersOnCookBooks & { cookbook: CookBook & { recipes: (CookBookToRecipes & { recipe: Recipe })[] } }) => {

          const cookbook = ur.cookbook;

          // If the cookbook has a recipe, and this recipe is private => generate a pre signed url for it.
          if (cookbook.recipes?.length > 0) {

            const recipe = cookbook.recipes[0].recipe;

            if (!recipe.isPublic && recipe.imagePath) {
              recipe.imageUrl = await this.supabaseService.generatePreSignedUrl({
                bucket: this.configService.get(ENV_VARS.PRIVATE_IMAGES_BUCKET),
                path: recipe.imagePath,
              })
            }

          }

          return {
            ...ur.cookbook,
            role: ur.role,
            addedAt: ur.addedAt,
          }

        }
      )
    )

    return userCookbooks;
  };

  // Get single cookbook
  async findOne(cookbookId: number, role: string) {

    // Get all users that have access to the cookbook.
    const cookbook = await this.prismaService.cookBook.findUnique({
      where: {
        id: cookbookId,
      },
      include: {
        users: {
          select: {
            user: true,
            role: true,
          }
        }
      }
    });

    // Attach role of the calling user.
    return {
      ...cookbook,
      role,
    }
  }

  // Update
  async update(
    cookbookId: number,
    updateCookbookDto: UpdateCookbookDto,
  ) {

    return await this.prismaService.cookBook.update({
      where: {
        id: cookbookId,
      },
      data: updateCookbookDto,
    });

  }

  // Delete
  async delete(
    cookbookId: number,
  ) {

    await this.prismaService.cookBook.delete({
      where: {
        id: cookbookId,
      },
    });

    return {
      message: 'Cookbook deleted successfully!'
    }

  }

  // Leave cookbook
  async leave(
    cookbookId: number,
    userId: number,
  ) {

    // Delete the relationship between the cookbook and the user.
    await this.prismaService.usersOnCookBooks.delete({
      where: {
        cookbookId_userId: {
          cookbookId,
          userId,
        }
      }
    });

    return {
      message: 'You\'ve left this cookbook successfully!'
    }

  }

  // Add members
  async addMembers(
    currentUserId: number,
    cookbookId: number,
    body: AddMembersDto,
  ) {

    // Start a transaction
    try {
      await this.prismaService.$transaction(async (tx) => {

        await Promise.all(
          body.members.map(async ({ role, userId }) => {

            // If trying to add himself => error.
            if (currentUserId === userId) {
              throw new BadRequestException('You cannot add yourself as a member');
            }

            // Check if the user exists
            const userExists = await tx.user.findUnique({
              where: { id: userId },
            });

            if (!userExists) {
              throw new BadRequestException(`User with ID ${userId} does not exist`);
            }

            // Check if the user is already a member of the cookbook
            const alreadyMember = await tx.usersOnCookBooks.findUnique({
              where: {
                cookbookId_userId: {
                  cookbookId: cookbookId,
                  userId: userId,
                },
              },
            });

            if (!alreadyMember) {
              // Create the membership record if the user is not already a member
              await tx.usersOnCookBooks.create({
                data: {
                  cookbook: {
                    connect: {
                      id: cookbookId,
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

  async getCookbookRecipes({
    cookbookRole,
    userId,
    cookbookId,
    pagination,
    title,
    cuisine,
    difficulty,
  }: IGetCookbookRecipesInput) {


    const whereFilter: Prisma.CookBookToRecipesWhereInput = {
      cookbookId,
      recipe: {
        ...(title && { title: { contains: title } }),
        ...(cuisine && { cuisine: { equals: cuisine } }),
        ...(difficulty && { difficulty: { equals: difficulty } }),
      }
    };

    const queryParams: Prisma.CookBookToRecipesFindManyArgs = {
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
    };

    if (pagination) {
      queryParams.skip = pagination.page * pagination.limit;
      queryParams.take = pagination.limit;
    }

    // Get all recipes on cookbook
    const recipesOnCookbook = await this.prismaService.cookBookToRecipes.findMany(queryParams);

    // For each recipe
      // If private => generate a presigned url for the image
      // Get the role of the current user on the recipe.
    const recipes = await Promise.all(
      recipesOnCookbook.map(async (
        recipeOnCookbook: CookBookToRecipes & { recipe: Recipe }
      ) => {

        const recipe = recipeOnCookbook.recipe;

        // If private and has image => generate pre signed url
        if(!recipe.isPublic && recipe.imagePath) {
          recipe.imageUrl = await this.supabaseService.generatePreSignedUrl({
            bucket: this.configService.get(ENV_VARS.PRIVATE_IMAGES_BUCKET),
            path: recipe.imagePath,
          });
        }

        // Get role of the current user on the recipe.
        const userRecipePermission = await this.prismaService.usersOnRecipes.findFirst({
          where: {
            recipeId: recipe.id,
            userId,
          },
          select: {
            role: true,
          }
        });

        const role = userRecipePermission?.role || cookbookRole;


        return {
          ...recipe,
          role,
        }

      }),
    )


    // Return recipes.
    return recipes;

  }

}
