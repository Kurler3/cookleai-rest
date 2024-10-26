import { PartialType } from '@nestjs/mapped-types';
import { CreateRecipeDto } from './create-recipe.dto';
import { IsOptional, ValidateIf } from 'class-validator';

export class UpdateRecipeDto extends PartialType(CreateRecipeDto) {

    @IsOptional()
    @ValidateIf(value => value === null)
    imageUrl?: null; // When updating a recipe's image, user can only make it null. Otherwise he'll have to upload a different one.
}
