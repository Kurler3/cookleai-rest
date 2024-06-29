import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {

    constructor(private jwtService: JwtService) {}

    async oauthLogin(user: User) {

        if(!user) {
            return {
                message: 'No google user found'
            }
        }

        // Sign the jwt
        const accessToken = await this.jwtService.signAsync(user);

        return {
            accessToken,
            refreshToken: '',
        }
    }

}
