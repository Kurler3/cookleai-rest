import { IPagination } from "./pagination.types";

export type IGetCookbookRecipesInput = {
    userId: number;
    cookbookId: number;
    pagination?: IPagination;
    title?: string;
    cuisine?: string;
    difficulty?: string;
    cookbookRole: string;
}