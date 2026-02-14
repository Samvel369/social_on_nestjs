-- AlterTable
ALTER TABLE "public"."DailyActionMark" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "lifeBalance" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."LifeTransaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LifeTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LifeTransaction_userId_idx" ON "public"."LifeTransaction"("userId");

-- AddForeignKey
ALTER TABLE "public"."LifeTransaction" ADD CONSTRAINT "LifeTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
