import { Injectable, Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RESET_FREQUENCY } from 'src/utils/constants';
import { subDays, subWeeks, subMonths, isBefore } from 'date-fns';

@Injectable()
export class QuotaService {
  constructor(private readonly prismaService: PrismaService) {}

  private async getQuota(userId: number, quotaType: string) {
    return this.prismaService.userQuota.findUnique({
      where: {
        userId_type: {
          userId,
          type: quotaType,
        },
      },
    });
  }

  private async createQuota(userId: number, quotaType: string) {
    //TODO: Refactor by type.
    return this.prismaService.userQuota.create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        used: 0,
        limit: 3,
        type: quotaType,
        isResettable: true,
        resetFrequency: RESET_FREQUENCY.DAILY,
        lastResetTimestamp: new Date(),
      },
    });
  }

  private shouldResetQuota(
    resetFrequency: string,
    lastResetTimestamp: Date,
  ): boolean {
    switch (resetFrequency) {
      case RESET_FREQUENCY.DAILY:
        return isBefore(lastResetTimestamp, subDays(new Date(), 1));
      case RESET_FREQUENCY.WEEKLY:
        return isBefore(lastResetTimestamp, subWeeks(new Date(), 1));
      case RESET_FREQUENCY.MONTHLY:
        return isBefore(lastResetTimestamp, subMonths(new Date(), 1));
      case RESET_FREQUENCY.NONE:
      default:
        return false;
    }
  }

  private async resetQuota(userId: number, quotaType: string) {
    await this.prismaService.userQuota.update({
      where: {
        userId_type: {
          userId,
          type: quotaType,
        },
      },
      data: {
        used: 0,
        lastResetTimestamp: new Date(),
      },
    });
  }
}
