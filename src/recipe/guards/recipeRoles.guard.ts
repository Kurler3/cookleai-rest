

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RecipeRoles } from 'src/decorators/RecipeRoles.decorator';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RecipeRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    
    const roles = this.reflector.get<string[]>(RecipeRoles, context.getHandler());

    const request = context.switchToHttp().getRequest();
    const userId = request.user.id;
    const recipeId = +request.params.recipeId;

    const userPermission = await this.prismaService.usersOnRecipes.findFirst({
      where: {
        userId,
        recipeId,
      },
    });

    if (!userPermission) {
      throw new UnauthorizedException('You do not have permission to view this recipe');
    }

    if (roles && !roles.includes(userPermission.role)) {
      throw new UnauthorizedException('You do not have permission to perform this action');
    }

    // Attach the role to the request object
    request.role = userPermission.role;

    return true;
  }
}
