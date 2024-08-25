import { Injectable } from '@nestjs/common';
import { CreateCookbookDto } from './dto/create-cookbook.dto';
import { UpdateCookbookDto } from './dto/update-cookbook.dto';
import { IPagination, ISelection } from 'src/types';
import { CookBook, Prisma, UsersOnCookBooks } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { COOKBOOK_ROLES } from 'src/utils/constants';

@Injectable()
export class CookbookService {


  constructor(private prismaService: PrismaService) { }


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
          select: cookbookSelection ? {
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
      (ur: UsersOnCookBooks & { cookbook: CookBook }) => ({ ...ur.cookbook, role: ur.role, addedAt: ur.addedAt })
    );

    return userCookbooks;
  };

  //TODO: Find PUBLIC cookbooks
  findAll() {
    return `This action returns all cookbook`;
  }

  //TODO: Get detailed cookbook? 
  findOne(id: number) {
    return `This action returns a #${id} cookbook`;
  }

  //TODO: Update cookbook
  update(id: number, updateCookbookDto: UpdateCookbookDto) {
    return `This action updates a #${id} cookbook`;
  }

  //TODO: Delete cookbook
  remove(id: number) {
    return `This action removes a #${id} cookbook`;
  }

}
