import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCookbookDto } from './dto/create-cookbook.dto';
import { IPagination, ISelection } from 'src/types';
import { CookBook, CookBookToRecipes, Prisma, Recipe, UsersOnCookBooks } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { COOKBOOK_ROLES, ENV_VARS, RECIPE_ROLES } from 'src/utils/constants';
import { UpdateCookbookDto } from './dto/update-cookbook.dto';
import { SupabaseService } from '../supabase/supabase.service';
import { ConfigService } from '@nestjs/config';
import { AddMembersDto } from './dto/add-members.dto';
import { IGetCookbookRecipesInput } from '../types/cookbook.types';
import { EditMembersDto } from './dto/edit-members.dto';
import { RemoveMembersDto } from './dto/remove-members.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class CookbookService {


  constructor(
    private prismaService: PrismaService,
    private supabaseService: SupabaseService,
    private configService: ConfigService,
    private userService: UserService,
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
              imageUrl: true,
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

            // Assert not current user.
            this.userService.assertNotCurrentUser(
              currentUserId, 
              userId, 
              'You cannot edit yourself',
            );

            // Check if the user exists
            await this.userService.assertUserExists(tx, userId);
            
            // Get cookbook permission for user being added to check if he already exists or not
            const cookbookPermission = await this.getCookbookPermission(tx, cookbookId, userId);

            if (!cookbookPermission) {

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

  // Edit members
  async editMembers(
    currentUserId: number,
    cookbookId: number,
    body: EditMembersDto,
  ) {

    try {
      await this.prismaService.$transaction(
        async (tx) => {
          await Promise.all(
            body.members.map(async (member) => this.updateMemberRole(tx, currentUserId, cookbookId, member))
          )
        }
      )
    } catch (error) {
      console.error('Error while editing members:', error);
      throw new BadRequestException('An error occurred while editing the members!');
    }

  }


  // Delete members
  async removeMembers(
    currentUserId: number,
    cookbookId: number,
    body: RemoveMembersDto,
  ) {

    try {
      await this.prismaService.$transaction(
        async (tx) => {
          await Promise.all(
            body.userIds.map(async (userId) => this.deleteMemberFromCookbook(tx, currentUserId, cookbookId, userId))
          )
        }
      )
    } catch (error) {
      console.error('Error while deleting members:', error);
      throw new BadRequestException('An error occurred while deleting the members!');
    }

  }


  async getCookbookRecipes({
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
        if (!recipe.isPublic && recipe.imagePath) {
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

        const role = userRecipePermission?.role ?? RECIPE_ROLES.VIEWER;

        return {
          ...recipe,
          role,
        }

      }),
    )


    // Return recipes.
    return recipes;

  }


  // Remove recipe from cookbook
  async removeRecipeFromCookbook({
    cookbookId,
    recipeId,
  }: {
    cookbookId: number,
    recipeId: number,
  }) {

    // Check if recipe actually exists
    const recipeExists = !!(await this.prismaService.recipe.findUnique({
      where: {
        id: recipeId,
      }
    }));

    if (!recipeExists) {
      throw new BadRequestException('Recipe does not exist!');
    }

    await this.prismaService.cookBookToRecipes.delete({
      where: {
        cookbookId_recipeId: {
          cookbookId,
          recipeId,
        }
      }
    });

    return {
      message: 'Recipe removed from cookbook successfully!'
    }

  }


  // Helper function to delete a single member from the cookbook.
  private async deleteMemberFromCookbook(
    tx: Prisma.TransactionClient,
    currentUserId: number,
    cookbookId: number,
    userId: number,
  ) {

     // Check that the user is not trying to delete himself.
    this.userService.assertNotCurrentUser(
      currentUserId, 
      userId, 
      'You can\'t delete yourself!'
    );

    // Check that the user actually exists.
    await this.userService.assertUserExists(tx, userId);

    // Get the current permission for the user being deleted in this cookbook
    const permission = await this.getCookbookPermission(tx, cookbookId, userId, true);

    // Delete the permission
    await this.deleteMember(tx, cookbookId, userId, permission);
  }

  private async deleteMember(
    tx: Prisma.TransactionClient,
    cookbookId: number,
    userId: number,
    permission: UsersOnCookBooks
  ) {

    if(!permission) {
      throw new BadRequestException(`User with ID ${userId} is not a member of this cookbook`);
    }

    await tx.usersOnCookBooks.delete({
      where: {
        cookbookId_userId: {
          cookbookId,
          userId,
        }
      }
    });
  }

  // Helper function to update a single member's role
  private async updateMemberRole(
    tx: Prisma.TransactionClient,
    currentUserId: number,
    cookbookId: number,
    { userId, role }: { userId: number, role: string },
  ) {

    // Check that the user is not trying to edit himself.
    this.userService.assertNotCurrentUser(
      currentUserId, 
      userId, 
      'You cannot edit yourself'
    );

    // Check that the user actually exists.
    await this.userService.assertUserExists(tx, userId);

    // Get the current permission for the user being edited in this cookbook
    const permission = await this.getCookbookPermission(tx, cookbookId, userId, true);
    
    // Update the role if needed
    await this.updateRoleIfDifferent(tx, permission, role, cookbookId, userId);

  }

  // Get the user's current role in the cookbook, or throw an error if not a member
  private async getCookbookPermission(
    tx: Prisma.TransactionClient,
    cookbookId: number,
    userId: number,
    throwErrIfNoPermission?: boolean,
  ) {
    const permission = await tx.usersOnCookBooks.findUnique({
      where: { cookbookId_userId: { userId, cookbookId } },
    });

    if (throwErrIfNoPermission && !permission) {
      throw new BadRequestException(`User with ID ${userId} is not a member of this cookbook`);
    }
    return permission;
  }

  // Update the user's role if it is different from the current role
  private async updateRoleIfDifferent(
    tx: Prisma.TransactionClient,
    permission: { role: string },
    newRole: string,
    cookbookId: number,
    userId: number,
  ) {
    if (permission.role !== newRole) {
      await tx.usersOnCookBooks.update({
        where: { cookbookId_userId: { userId, cookbookId } },
        data: { role: newRole },
      });
    }
  }


}
