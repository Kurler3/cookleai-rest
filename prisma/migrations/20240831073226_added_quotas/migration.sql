-- CreateTable
CREATE TABLE "UserQuota" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "used" INTEGER NOT NULL,
    "limit" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "lastResetTimestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserQuota_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserQuota" ADD CONSTRAINT "UserQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
