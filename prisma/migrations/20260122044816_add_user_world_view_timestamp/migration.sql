/*
  Warnings:

  - You are about to drop the column `lastWorldVisit` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "lastWorldVisit",
ADD COLUMN     "lastViewedWorldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
