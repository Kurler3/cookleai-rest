import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {

  constructor(
    configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      clientID: configService.get("GOOGLE_CLIENT_ID"),
      clientSecret: configService.get("GOOGLE_CLIENT_SECRET"),
      callbackURL: 'http://localhost:3000/auth/google-redirect', //TODO: Change when in prod
      scope: ['email', 'profile'],
    });
  }

  // This returns the data as we want to the callback
  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    
    const { name, emails, photos } = profile;

    // Get user from db
    let user = await this.userService.findByEmail(emails[0].value);

    // If no user found in db, create a new one in db
    if(!user) {

      try {
        
        // Create it
        user = await this.userService.createUser({
          email: emails[0].value,
          firstName: name.givenName,
          lastName: name.familyName,
          fullName: `${name.givenName} ${name.familyName}`,
          avatar:  photos[0].value,
        })
        
      } catch (error) {

        console.error('Error while creating user for the first time...', error);

        done(error, null);
      }

    }

    // Return user from db
    done(null, user);
  }
}