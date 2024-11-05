

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RecipeRoles } from 'src/decorators/RecipeRoles.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { RECIPE_ROLES } from '../../utils/constants';

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

    let role = userPermission?.role;

    if (!role) {

      // If no role in the recipe, try to find a cookbook that this user is in and that this recipe is in as well.
        const userHasAccess = !!(await this.prismaService.cookBook.findFirst({
          where: {
              // Find a cookbook that contains the recipe
              recipes: {
                  some: {
                      recipeId: recipeId
                  }
              },
              // Check if the user is associated with that cookbook
              users: {
                  some: {
                      userId: userId
                  }
              }
          }
      }));

      if(!userHasAccess) {
        throw new UnauthorizedException('You do not have permission to view this recipe');
      }

      role = RECIPE_ROLES.VIEWER;

    }

    if (roles && !roles.includes(role)) {
      throw new UnauthorizedException('You do not have permission to perform this action');
    }

    // Attach the role to the request object
    request.role = role;

    return true;
  }
}
