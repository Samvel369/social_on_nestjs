-- DropForeignKey
ALTER TABLE "public"."Action" DROP CONSTRAINT "Action_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ActionMark" DROP CONSTRAINT "ActionMark_actionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ActionMark" DROP CONSTRAINT "ActionMark_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FriendRequest" DROP CONSTRAINT "FriendRequest_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FriendRequest" DROP CONSTRAINT "FriendRequest_senderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."IgnoredUser" DROP CONSTRAINT "IgnoredUser_ignoredId_fkey";

-- DropForeignKey
ALTER TABLE "public"."IgnoredUser" DROP CONSTRAINT "IgnoredUser_ignorerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PotentialFriendView" DROP CONSTRAINT "PotentialFriendView_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PotentialFriendView" DROP CONSTRAINT "PotentialFriendView_viewerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Subscriber" DROP CONSTRAINT "Subscriber_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Subscriber" DROP CONSTRAINT "Subscriber_subscriberId_fkey";

-- AlterTable
ALTER TABLE "public"."Action" ADD COLUMN     "publishCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "avatarUrl" SET DEFAULT '/static/default-avatar.png';

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Action" ADD CONSTRAINT "Action_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActionMark" ADD CONSTRAINT "ActionMark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActionMark" ADD CONSTRAINT "ActionMark_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "public"."Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FriendRequest" ADD CONSTRAINT "FriendRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FriendRequest" ADD CONSTRAINT "FriendRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscriber" ADD CONSTRAINT "Subscriber_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscriber" ADD CONSTRAINT "Subscriber_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PotentialFriendView" ADD CONSTRAINT "PotentialFriendView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PotentialFriendView" ADD CONSTRAINT "PotentialFriendView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IgnoredUser" ADD CONSTRAINT "IgnoredUser_ignorerId_fkey" FOREIGN KEY ("ignorerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IgnoredUser" ADD CONSTRAINT "IgnoredUser_ignoredId_fkey" FOREIGN KEY ("ignoredId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
