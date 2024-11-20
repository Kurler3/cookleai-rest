import { Controller, Get, UseGuards, Query, Delete, Res } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard/jwt-auth.guard';
import { GetUser } from './decorator/user.decorator';
import { User } from '@prisma/client';
import { UserService } from './user.service';
import { Response } from 'express';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {

    constructor(
        private userService: UserService,
    ) {}

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

    // Search users.
    @Get('search')
    async search(
        @Query('search') searchValue: string,
    ) {
        return this.userService.search(searchValue);
    }

    // Delete own account.
    @Delete('delete-account')
    async deleteAccount(
        @GetUser('id') userId: number,
        @Res() res: Response
    ) {

        await this.userService.deleteAccount(userId);

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: false,     // Or true if the cookie was set in production with HTTPS
            // sameSite: 'none',
            path: '/',         
          });
    
        return {
            message: 'Your account has been deleted successfully!'        
        }
    }

}
