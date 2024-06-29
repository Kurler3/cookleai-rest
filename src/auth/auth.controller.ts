import { Controller, Get, InternalServerErrorException, Req, Res, UseGuards } from '@nestjs/common';
import { GoogleOAuthGuard } from './guard/google-oauth.guard';
import { GetUser } from 'src/user/decorator/user.decorator';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@UseGuards(GoogleOAuthGuard)
@Controller('auth')
export class AuthController {

    constructor(
        private authService: AuthService,
        private configService: ConfigService
    ) {}
    // AUTH
    @Get('google')
    async googleAuth() {}

    // AUTH CALLBACK
    @Get('google-redirect')
    async googleAuthRedirect(
        @Res() res: Response,
        @GetUser() user // Data that comes from the google strategy validate func
    ) {

        try {

            const frontendUrl = this.configService.get('FRONTEND_URL')

            const token = await this.authService.oauthLogin(user);

            res.redirect(`${frontendUrl}/oauth?token=${token.accessToken}`);

        } catch (error) {
            console.error('Error in /auth/google-redirect: ', error);
            throw new InternalServerErrorException('Something went wrong!');
        }
        
    }

}
