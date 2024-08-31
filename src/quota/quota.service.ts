import { BadGatewayException, Injectable, Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DEFAULT_QUOTAS, QUOTA_TYPES, RESET_FREQUENCY } from 'src/utils/constants';
import { subDays, subWeeks, subMonths, isBefore } from 'date-fns';

@Injectable()
export class QuotaService {
  constructor(private readonly prismaService: PrismaService) {}

  // Exposed function to get quotas by type.
  public async getQuotaByType(userId: number, quotaType: string) {

    // Get the quota.
    let quota = await this.getQuota(userId, quotaType);
    
    // If doesn't exist => create it.
    if(!quota) {
        quota = await this.createQuota(userId, quotaType);
    
    // If exists => check if needs to be reset.
    } else if(
        quota.isResettable && this.shouldResetQuota(quota.resetFrequency, quota.lastResetTimestamp)
    ) {
        quota = await this.resetQuota(userId, quotaType);
    }

    // Return the quota.
    return quota;
  }



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

    let defaultQuota: {
        limit: number;
        isResettable: boolean;
        resetFrequency: string;
    };

    switch(quotaType) {

        case QUOTA_TYPES.AI:
            defaultQuota = DEFAULT_QUOTAS[quotaType];
            break;  
        default:
            throw new BadGatewayException(
                `${quotaType} is not a valid quota type.`,
            )
    }

    if(!defaultQuota) {
        throw new BadGatewayException(
            `No default quota found for the quota type: ${quotaType}. Please contact Admin`
        );
    }

    return this.prismaService.userQuota.create({
        data: {
            user: {
                connect: {
                    id: userId,
                }
            },
            used: 0,
            lastResetTimestamp: new Date(),
            ...defaultQuota,
            type: quotaType,
        }
    })
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
    return await this.prismaService.userQuota.update({
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
