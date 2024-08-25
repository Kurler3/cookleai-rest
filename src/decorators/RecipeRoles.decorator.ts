import { Reflector } from "@nestjs/core";

export const RecipeRoles = Reflector.createDecorator<string[]>();