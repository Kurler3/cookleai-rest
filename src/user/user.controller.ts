import { Controller, Get, Param, UseGuards } from '@nestjs/common';
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

    // Get quota (s)
    @Get('/quotas')
    async getQuotas(
        @GetUser('id') userId: number,
        @Param('quotaType') quotaType: string, 
    ) {
        return this.userService.getQuotas(userId, quotaType);
    }
}
