-- DropIndex
DROP INDEX IF EXISTS "DailyActionMark_dailyActionId_userId_minuteSlot_key";

-- DropIndex
DROP INDEX IF EXISTS "DailyActionMark_dailyActionId_minuteSlot_idx";

-- Deduplicate: оставляем только последнюю отметку для каждой пары (dailyActionId, userId)
DELETE FROM "DailyActionMark" a
USING "DailyActionMark" b
WHERE a."dailyActionId" = b."dailyActionId"
  AND a."userId" = b."userId"
  AND a.id < b.id;

-- AlterTable
ALTER TABLE "DailyActionMark" RENAME COLUMN "minuteSlot" TO "createdAt";

-- CreateIndex
CREATE UNIQUE INDEX "DailyActionMark_dailyActionId_userId_key" ON "DailyActionMark"("dailyActionId", "userId");

-- CreateIndex
CREATE INDEX "DailyActionMark_dailyActionId_createdAt_idx" ON "DailyActionMark"("dailyActionId", "createdAt");
