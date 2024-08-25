import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const GetSearchTerm = createParamDecorator<string | null>(
    (_data: unknown, ctx: ExecutionContext) => {

        let search = ctx.switchToHttp().getRequest().query.search;

        if(search) {
            if(search.length === 0) search = null;
            else search = search.toLowerCase();
        }

        return search;
    }
)