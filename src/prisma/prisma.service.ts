import { Global, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Global()
@Injectable()
export class PrismaService  extends PrismaClient {
    constructor(
        configService: ConfigService
    ) {
        // Calls the constructor of the prisma client
        super({
          datasources: {
            db: {
              url: configService.get("DATABASE_URL"),
            },
          },
        });
      }
    
    //   cleanDb() {
    //     return this.$transaction([this.bookmark.deleteMany(), this.user.deleteMany()]);
    //   }

}
