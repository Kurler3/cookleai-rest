import { IsBoolean, IsJSON, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl } from "class-validator";
import { IIngredient, INutrients } from "src/types";

export class CreateRecipeDto {

    @IsString()
    @IsNotEmpty()
    title: string

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    description?: string

    @IsBoolean()
    @IsOptional()
    isPublic?: boolean;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    servings?: string

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    notes?: string

    @IsNumber()
    @IsOptional()
    prepTime?: number

    @IsNumber()
    @IsOptional()
    cookTime?: number

    @IsJSON()
    @IsOptional()
    nutrients?: INutrients;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    cuisine?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    language?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    difficulty?: string;

    @IsNumber()
    @IsNotEmpty()
    @IsOptional()
    rating?: number;

    @IsJSON()
    @IsNotEmpty()
    @IsOptional()
    ingredients?: IIngredient[];

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    instructions?: string[];
}
