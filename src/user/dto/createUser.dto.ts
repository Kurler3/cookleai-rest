import { IsEmail, IsNotEmpty, IsString, IsUrl } from "class-validator";


export class CreateUserDto {

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsString()
    @IsUrl()
    avatar: string;
}