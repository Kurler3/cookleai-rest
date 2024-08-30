import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { CookbookRoles } from "src/decorators/CookbookRoles.decorator";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class CookbookRolesGuard implements CanActivate {

    constructor(
        private readonly reflector: Reflector,
        private readonly prismaService: PrismaService,
      ) {}
    
      async canActivate(context: ExecutionContext): Promise<boolean> {
        
        const roles = this.reflector.get<string[]>(CookbookRoles, context.getHandler());
    
        const request = context.switchToHttp().getRequest();
        const userId = request.user.id;
        const cookbookId = +request.params.cookbookId; // Adjust based on your route parameters
    
        const userPermission = await this.prismaService.usersOnCookBooks.findFirst({
          where: {
            userId,
            cookbookId,
          },
        });
    
        if (!userPermission) {
          throw new UnauthorizedException('You do not have permission to view this cookbook');
        }
    
        if (roles && !roles.includes(userPermission.role)) {
          throw new UnauthorizedException('You do not have permission to perform this action');
        }
    
        // Attach the role to the request object
        request.role = userPermission.role;
    
        return true;
      }


}