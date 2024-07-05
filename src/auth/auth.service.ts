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

        const [
            accessToken,
            refreshToken,
        ] = await Promise.all([
            this.jwtService.signAsync(user, {
                expiresIn: '15m',
            }),
            this.jwtService.signAsync(user, {
                expiresIn: '7d',
            })
        ])

        return {
            accessToken,
            refreshToken,
        }
    }

    async refreshAccessToken(refreshToken: string | null) {

        try {

            const payload = await this.jwtService.verifyAsync(refreshToken);

            const accessToken = await this.jwtService.signAsync(payload, {
                expiresIn: '15m'
            });

            return accessToken;
            
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
        
        

    }

}
