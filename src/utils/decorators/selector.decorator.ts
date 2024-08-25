import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { ISelection } from "src/types";



export const GetSelection = createParamDecorator<ISelection | null>(
    (_data: unknown, ctx: ExecutionContext) => {

        const request = ctx.switchToHttp().getRequest();

        // Get selection query param.
        const selection = request.query.selection as string;

        if(!selection) return null;

        const keys = selection.replace(/\s/g, '').split(',');

        return keys.reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {});
    }
)