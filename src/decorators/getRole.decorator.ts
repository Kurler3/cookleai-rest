import { createParamDecorator, ExecutionContext } from "@nestjs/common";


export const GetRole = createParamDecorator(
    (data: undefined, ctx: ExecutionContext) => {
        return ctx.switchToHttp().getRequest().role;
    }
)