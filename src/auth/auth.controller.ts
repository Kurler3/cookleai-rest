import {
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { GoogleOAuthGuard } from './guard/google-oauth.guard';
import { GetUser } from 'src/user/decorator/user.decorator';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { GetRefreshToken } from './decorator/refreshToken.decorator';
import { JwtGuard } from './guard/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  // Init Google OAuth
  @UseGuards(GoogleOAuthGuard)
  @Get('google')
  async googleAuth() {}

  // AUTH CALLBACK
  @UseGuards(GoogleOAuthGuard)
  @Get('google-redirect')
  async googleAuthRedirect(
    @Res() res: Response,
    @GetUser() user: User, // Data that comes from the google strategy validate func
  ) {
    try {
      
      const frontendUrl = this.configService.get('FRONTEND_URL');

      const tokens = await this.authService.oauthLogin(user);

      // Set the refresh token as an HTTP-only cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true, // Cannot be accessed by client-side JavaScript
        secure: false, // Set to false for local development (no HTTPS)
        // sameSite: 'none', // Required for cross-origin requests
        path: '/', // Cookie is available for the whole site
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days
      });

      res.redirect(`${frontendUrl}/oauth-redirect?token=${tokens.accessToken}`);
    } catch (error) {
      console.error('Error in /auth/google-redirect: ', error);
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  // Refresh
  @Get('refresh')
  async refresh(@GetRefreshToken() refreshToken: string | null) {
    return this.authService.refreshAccessToken(refreshToken);
  }

  // Logout
  @UseGuards(JwtGuard)
  @Post('logout')
  logout(@Res() res: Response) {

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false,     // Or true if the cookie was set in production with HTTPS
      // sameSite: 'none',
      path: '/',         
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  }
}
