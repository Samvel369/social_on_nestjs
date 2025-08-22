/*
  Warnings:

  - A unique constraint covering the columns `[viewerId,userId]` on the table `PotentialFriendView` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PotentialFriendView_viewerId_userId_key" ON "public"."PotentialFriendView"("viewerId", "userId");
