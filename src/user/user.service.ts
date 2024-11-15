import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/createUser.dto';
import { RecipeService } from 'src/recipe/recipe.service';
import { Prisma } from '@prisma/client';
import { QuotaService } from 'src/quota/quota.service';

@Injectable()
export class UserService {
  constructor(
    private prismaService: PrismaService,
    private recipeService: RecipeService,
    private quotaService: QuotaService,
  ) { }

  // Create user
  async createUser(createUserDto: CreateUserDto) {
    return await this.prismaService.user.create({
      data: createUserDto,
    });
  }

  // Find user by email
  async findByEmail(email: string) {
    return this.prismaService.user.findUnique({
      where: {
        email,
      },
    });
  }

  // Find user by id
  async findById(id: number) {
    return this.prismaService.user.findUnique({
      where: {
        id,
      },
    });
  }

  // Get all recipes for a given user
  async getUserRecipes(userId: number) {
    return this.recipeService.findMyRecipes({ userId });
  }

  // Get all quota of user
  async getQuotas(userId: number) {

    const quotas = await this.prismaService.userQuota.findMany({
      where: {
        userId,
      },
    });

    return quotas;
  }

  async getQuotaByType(userId: number, quotaType: string) {
    return this.quotaService.getQuotaByType(userId, quotaType);
  }

  async search(
    searchValue: string,
  ) {

    if (!searchValue) {
      throw new BadRequestException('You need to provide a search term.');
    }

    const users = await this.prismaService.user.findMany({
      where: {
        OR: [
          {
            email: {
              contains: searchValue,
            }
          },
          {
            fullName: {
              contains: searchValue,
            }
          }
        ]
      }
    });


    return users;
  }

  // Verify the user exists in the database
  async assertUserExists(tx: Prisma.TransactionClient, userId: number) {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException(`User with ID ${userId} does not exist`);
    }
  }

  assertNotCurrentUser(currentUserId: number, userId: number, errMsg: string) {
    if (currentUserId === userId) {
      throw new BadRequestException(errMsg);
    }
  }

}
