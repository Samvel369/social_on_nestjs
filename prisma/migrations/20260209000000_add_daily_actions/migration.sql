-- CreateTable
CREATE TABLE "DailyAction" (
    "id" SERIAL NOT NULL,
    "text" VARCHAR(255) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyActionMark" (
    "id" SERIAL NOT NULL,
    "dailyActionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "minuteSlot" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyActionMark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyActionMark_dailyActionId_userId_minuteSlot_key" ON "DailyActionMark"("dailyActionId", "userId", "minuteSlot");

-- CreateIndex
CREATE INDEX "DailyActionMark_dailyActionId_minuteSlot_idx" ON "DailyActionMark"("dailyActionId", "minuteSlot");

-- AddForeignKey
ALTER TABLE "DailyActionMark" ADD CONSTRAINT "DailyActionMark_dailyActionId_fkey" FOREIGN KEY ("dailyActionId") REFERENCES "DailyAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyActionMark" ADD CONSTRAINT "DailyActionMark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed 10 daily actions
INSERT INTO "DailyAction" ("text", "sortOrder") VALUES
('Пью кофе', 1),
('Пью чай', 2),
('Завтракаю', 3),
('Обедаю', 4),
('Гуляю', 5),
('Слушаю музыку', 6),
('Читаю', 7),
('Работаю за компьютером', 8),
('Смотрю видео', 9),
('Отдыхаю', 10);
