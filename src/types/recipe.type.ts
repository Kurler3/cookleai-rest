import { IPagination } from "./pagination.types";


export type INutrients = {
    calories: number;
    carbohydrates: number;
    protein: number;
    fat: number;
}

export type IIngredient = {
    name: string;
    amount: number;
    unit: string;
}


export type IFindMyRecipesInput = {
    userId: number;
    pagination?: IPagination;
    title?: string;
    cuisine?: string;
    difficulty?: string;
}

