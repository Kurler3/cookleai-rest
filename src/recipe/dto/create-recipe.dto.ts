import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl } from "class-validator";

export class CreateRecipeDto {

    @IsString()
    @IsNotEmpty()
    title: string

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    description?: string

    @IsUrl()
    @IsOptional()
    image?: string

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    servings?: string

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    notes?: string

    @IsNumber()
    @IsNotEmpty()
    @IsOptional()
    preTime?: number

    @IsNumber()
    @IsNotEmpty()
    @IsOptional()
    cookTime?: number

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    

}
