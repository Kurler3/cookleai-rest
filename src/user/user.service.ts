import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/createUser.dto';
import { RecipeService } from 'src/recipe/recipe.service';

@Injectable()
export class UserService {

    constructor(
        private prismaService: PrismaService,
        private recipeService: RecipeService,
    ) {}

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

    // Find user by id
    async findById(id: number) {
        return this.prismaService.user.findUnique({
            where: {
                id,
            }
        })
    }

    // Get all recipes for a given user
    async getUserRecipes(userId: number) {
        return this.recipeService.getUserRecipes(userId);
    }

}
