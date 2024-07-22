import { Injectable } from '@nestjs/common';
import { CreateCookbookDto } from './dto/create-cookbook.dto';
import { UpdateCookbookDto } from './dto/update-cookbook.dto';
import { IPagination } from 'src/types';
import { Prisma, UsersOnCookBooks } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Cookbook } from './entities/cookbook.entity';

@Injectable()
export class CookbookService {


  constructor(private prismaService: PrismaService) {}


  create(createCookbookDto: CreateCookbookDto) {
    return 'This action adds a new cookbook';
  }

  findAll() {
    return `This action returns all cookbook`;
  }

  findOne(id: number) {
    return `This action returns a #${id} cookbook`;
  }

  update(id: number, updateCookbookDto: UpdateCookbookDto) {
    return `This action updates a #${id} cookbook`;
  }

  remove(id: number) {
    return `This action removes a #${id} cookbook`;
  }



  async getMyCookbooks(
    userId: number, 
    pagination?: IPagination
  ) {

    const queryParams: Prisma.UsersOnCookBooksFindManyArgs = {
      where: {
        userId,
      },
      include: {
        cookbook: {
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
  
    const userRecipePermissions = await this.prismaService.usersOnCookBooks.findMany(queryParams);

    const userRecipes = userRecipePermissions.map(
      (ur: UsersOnCookBooks & { cookbook: Cookbook }) => ({...ur.cookbook, role: ur.role, addedAt: ur.addedAt}) 
    );

    return userRecipes;

  } 

}
