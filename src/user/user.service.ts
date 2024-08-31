import { Injectable } from '@nestjs/common';
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
  ) {}

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
    return this.recipeService.findMyRecipes(userId);
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
}
