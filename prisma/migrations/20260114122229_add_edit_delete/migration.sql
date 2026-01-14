-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN     "deletedForReceiver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEdited" BOOLEAN NOT NULL DEFAULT false;
