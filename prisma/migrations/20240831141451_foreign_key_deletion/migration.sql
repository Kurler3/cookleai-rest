-- DropForeignKey
ALTER TABLE "UserQuota" DROP CONSTRAINT "UserQuota_userId_fkey";

-- DropForeignKey
ALTER TABLE "blocked_user" DROP CONSTRAINT "blocked_user_blockedId_fkey";

-- DropForeignKey
ALTER TABLE "blocked_user" DROP CONSTRAINT "blocked_user_blockerId_fkey";

-- DropForeignKey
ALTER TABLE "cookbook_to_recipes" DROP CONSTRAINT "cookbook_to_recipes_cookbookId_fkey";

-- DropForeignKey
ALTER TABLE "cookbook_to_recipes" DROP CONSTRAINT "cookbook_to_recipes_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "follow" DROP CONSTRAINT "follow_followerId_fkey";

-- DropForeignKey
ALTER TABLE "follow" DROP CONSTRAINT "follow_followingId_fkey";

-- DropForeignKey
ALTER TABLE "users_on_cookbooks" DROP CONSTRAINT "users_on_cookbooks_cookbookId_fkey";

-- DropForeignKey
ALTER TABLE "users_on_cookbooks" DROP CONSTRAINT "users_on_cookbooks_userId_fkey";

-- AddForeignKey
ALTER TABLE "UserQuota" ADD CONSTRAINT "UserQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow" ADD CONSTRAINT "follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow" ADD CONSTRAINT "follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_user" ADD CONSTRAINT "blocked_user_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_user" ADD CONSTRAINT "blocked_user_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cookbook_to_recipes" ADD CONSTRAINT "cookbook_to_recipes_cookbookId_fkey" FOREIGN KEY ("cookbookId") REFERENCES "cookbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cookbook_to_recipes" ADD CONSTRAINT "cookbook_to_recipes_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_on_cookbooks" ADD CONSTRAINT "users_on_cookbooks_cookbookId_fkey" FOREIGN KEY ("cookbookId") REFERENCES "cookbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_on_cookbooks" ADD CONSTRAINT "users_on_cookbooks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
