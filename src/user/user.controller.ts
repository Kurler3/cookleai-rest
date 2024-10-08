import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard/jwt-auth.guard';
import { GetUser } from './decorator/user.decorator';
import { User } from '@prisma/client';
import { UserService } from './user.service';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {

    constructor(private userService: UserService) {}

    // Get user from token
    @Get('me')
    async getMe(@GetUser() user: User) {
        return user;
    }

    // Get quota by type.
    @Get('/quota-by-type')
    async getQuotas(
        @GetUser('id') userId: number,
        @Query('quotaType') quotaType: string, 
    ) {
        return this.userService.getQuotaByType(userId, quotaType);
    }
}
