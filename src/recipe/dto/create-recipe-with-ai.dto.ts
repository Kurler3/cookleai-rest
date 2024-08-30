import { IsNotEmpty, IsString } from "class-validator";


export class CreateRecipeWithAiDto {

    @IsString()
    @IsNotEmpty()
    prompt: string;

}