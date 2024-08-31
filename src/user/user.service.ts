import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/createUser.dto';
import { RecipeService } from 'src/recipe/recipe.service';
import { Prisma } from '@prisma/client';
import { subDays, subWeeks, subMonths, isBefore } from 'date-fns';
import { RESET_FREQUENCY } from 'src/utils/constants';

@Injectable()
export class UserService {
  constructor(
    private prismaService: PrismaService,
    private recipeService: RecipeService,
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
    // let quota = await this.prismaService.userQuota.findFirst({
    //   where: {
    //     userId,
    //     type: quotaType,
    //   },
    // });

    // // If the quota type is AI and it doesn't exist yet => create it.
    // if (quotaType === 'ai' && !quota) {

    //   quota = await this.prismaService.userQuota.create({
    //     data: {
    //       user: {
    //         connect: {
    //           id: userId,
    //         },
    //       },
    //       used: 0,
    //       limit: 3,
    //       type: 'ai',
    //       isResettable: true,
    //       resetFrequency: RESET_FREQUENCY.DAILY,
    //       lastResetTimestamp: new Date(),
    //     },
    //   });

    // } else if (quota.isResettable) {
    //   // If quota is resettable, check if it is needs to be reset.

    //   let shouldReset = false;

    //   // Determine the reset threshold based on reset frequency
    //   switch (quota.resetFrequency) {
    //     case RESET_FREQUENCY.DAILY:
    //       shouldReset = isBefore(
    //         quota.lastResetTimestamp,
    //         subDays(new Date(), 1),
    //       );
    //       break;
    //     case RESET_FREQUENCY.WEEKLY:
    //       shouldReset = isBefore(
    //         quota.lastResetTimestamp,
    //         subWeeks(new Date(), 1),
    //       );
    //       break;
    //     case RESET_FREQUENCY.MONTHLY:
    //       shouldReset = isBefore(
    //         quota.lastResetTimestamp,
    //         subMonths(new Date(), 1),
    //       );
    //       break;
    //     case RESET_FREQUENCY.NONE:
    //       shouldReset = false;
    //       break;
    //   }

    //   // Reset the quota if necessary
    //   if (shouldReset) {
    //     await this.prismaService.userQuota.update({
    //       where: { id: quota.id },
    //       data: {
    //         used: 0,
    //         lastResetTimestamp: new Date(),
    //       },
    //     });
    //   }
    // }

    // return quota;
  }
}
