/*
  Warnings:

  - Made the column `userId` on table `Action` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Action" DROP CONSTRAINT "Action_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Action" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "idx_user_isPublished_id" ON "public"."Action"("userId", "isPublished", "id");

-- CreateIndex
CREATE INDEX "idx_user_isPublished_norm" ON "public"."Action"("userId", "isPublished", "normalizedText");

-- CreateIndex
CREATE INDEX "idx_isPublished_norm" ON "public"."Action"("isPublished", "normalizedText");

-- CreateIndex
CREATE INDEX "idx_isPublished_expires" ON "public"."Action"("isPublished", "expiresAt");

-- AddForeignKey
ALTER TABLE "public"."Action" ADD CONSTRAINT "Action_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
