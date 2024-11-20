import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async oauthLogin(user: User) {
    if (!user) {
      return {
        message: 'No google user found',
      };
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(user, {
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(user, {
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string | null) {
    try {
      
      if(!refreshToken) {
        throw new UnauthorizedException('Missing refresh token');
      }
 
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const { exp, iat, ...restPayload } = payload;

      const accessToken = await this.jwtService.signAsync(restPayload, {
        expiresIn: '15m',
      });

      return { accessToken };
    } catch (error) {
        console.log('error: ', error)
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  logout(
    res: Response
  ) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false,     // Or true if the cookie was set in production with HTTPS
      // sameSite: 'none',
      path: '/',         
    });

  }

}
