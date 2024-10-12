import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCookbookDto } from './dto/create-cookbook.dto';
import { IPagination, ISelection } from 'src/types';
import { CookBook, Prisma, UsersOnCookBooks } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { COOKBOOK_ROLES } from 'src/utils/constants';

@Injectable()
export class CookbookService {


  constructor(private prismaService: PrismaService) { }

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
                    image: true,
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

    const userCookbooks = userCookbookPermissions.map(
      (ur: UsersOnCookBooks & { cookbook: CookBook }) => ({
        ...ur.cookbook,
        role: ur.role,
        addedAt: ur.addedAt,
      })
    );

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
          // include: {
          //   user: true,
          // }
        }
      }
    });

    // Attach role of the calling user.
    return {
      ...cookbook,
      role,
    }
  }
}
