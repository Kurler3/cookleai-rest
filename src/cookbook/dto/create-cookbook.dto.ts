import { IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";


export class CreateCookbookDto {

    @IsString()
    @IsNotEmpty()
    title: string;
}
