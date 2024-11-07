import { ArrayNotEmpty, IsArray, IsNumber } from "class-validator";

export class RemoveMembersDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsNumber({}, { each: true })
    userIds: number[];
}