import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/createUser.dto';

@Injectable()
export class UserService {


    constructor(private prismaService: PrismaService) {}

    // Create user
    async createUser(createUserDto: CreateUserDto) {
        return await this.prismaService.user.create({
            data: createUserDto,
        })
    }
    
    // Find user by email
    async findByEmail(email: string) {
        return this.prismaService.user.findUnique({
            where: {
                email,
            }
        })
    }

}
