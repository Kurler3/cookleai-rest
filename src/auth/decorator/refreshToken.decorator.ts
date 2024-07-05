import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const GetRefreshToken = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();

        return request.cookies ? request.cookies.refreshToken : null;
    }
)