

import { IsArray, IsIn, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { COOKBOOK_ROLES } from '../../utils/constants';

export class MemberDto {
    @IsInt()
    userId: number;

    @IsIn([
        COOKBOOK_ROLES.EDITOR, 
        COOKBOOK_ROLES.VIEWER
    ])
    role: string;
}

export class AddMembersDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MemberDto)
    members: MemberDto[];
}
