import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UserService } from "src/user/user.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {

    constructor(
        configService: ConfigService,
        private userService: UserService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get("JWT_SECRET"),
        })
    }

    async validate(payload: { id: number }) {

        if(!payload.id) {
            throw new UnauthorizedException('Invalid payload');
        }

        const user = await this.userService.findById(payload.id);

        if(!user) {
            throw new UnauthorizedException('Invalid payload');
        }

        return user;
    }
}
