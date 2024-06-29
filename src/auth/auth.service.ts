import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

    constructor(private jwtService: JwtService) {}

    async oauthLogin(user) {

        if(!user) {
            return {
                message: 'No google user found'
            }
        }

        // Create payload for token
        const payload = {
            email: user.email,
            name: user.fullName,
        }

        // Sign the jwt
        const accessToken = await this.jwtService.signAsync(payload);

        // Return the tokens

        return {
            accessToken,
            refreshToken: '',
        }
    }

}
