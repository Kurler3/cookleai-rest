import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { RecipeModule } from './recipe/recipe.module';
import { CookbookModule } from './cookbook/cookbook.module';
import { SupabaseModule } from './supabase/supabase.module';
import { GeminiModule } from './gemini/gemini.module';
import { QuotaModule } from './quota/quota.module';
import { MembershipService } from './membership/membership.service';
import { MembershipModule } from './membership/membership.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    RecipeModule,
    CookbookModule,
    SupabaseModule,
    GeminiModule,
    QuotaModule,
    MembershipModule
  ],
  controllers: [AppController],
  providers: [AppService, MembershipService],
})
export class AppModule {}
