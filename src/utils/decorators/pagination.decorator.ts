import { createParamDecorator, ExecutionContext } from "@nestjs/common";


export const GetPagination = createParamDecorator<{ page: number, limit: number }>(
    (_data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();

        const page = parseInt(request.query.page as string) || 0;
        const limit = parseInt(request.query.limit as string) || 15;

        if(!page && !limit) return null;
        return {
            page,
            limit,
        };
    }
)


