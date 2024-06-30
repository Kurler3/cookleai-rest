import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard/jwt-auth.guard';
import { GetUser } from './decorator/user.decorator';
import { User } from '@prisma/client';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {

    // Get user from token
    @Get('me')
    async getMe(@GetUser() user: User) {
        return user;
    }
}
