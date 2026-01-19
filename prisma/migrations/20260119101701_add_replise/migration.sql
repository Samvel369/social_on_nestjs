-- CreateTable
CREATE TABLE "public"."_ReplyRelation" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ReplyRelation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ReplyRelation_B_index" ON "public"."_ReplyRelation"("B");

-- AddForeignKey
ALTER TABLE "public"."_ReplyRelation" ADD CONSTRAINT "_ReplyRelation_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ReplyRelation" ADD CONSTRAINT "_ReplyRelation_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
