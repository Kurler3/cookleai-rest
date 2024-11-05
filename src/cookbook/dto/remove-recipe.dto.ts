import { IsInt, IsNotEmpty } from "class-validator";



export class RemoveRecipeDto {

    @IsInt()
    @IsNotEmpty()
    recipeId: number;

}