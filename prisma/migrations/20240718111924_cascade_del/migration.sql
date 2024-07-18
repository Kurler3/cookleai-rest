-- DropForeignKey
ALTER TABLE "users_on_recipes" DROP CONSTRAINT "users_on_recipes_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "users_on_recipes" DROP CONSTRAINT "users_on_recipes_userId_fkey";

-- AddForeignKey
ALTER TABLE "users_on_recipes" ADD CONSTRAINT "users_on_recipes_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_on_recipes" ADD CONSTRAINT "users_on_recipes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
