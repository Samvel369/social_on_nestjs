-- CreateEnum
CREATE TYPE "public"."FriendRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatarUrl" TEXT NOT NULL DEFAULT '/app/static/uploads/default-avatar.png',
    "birthdate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Приветствую всех!',
    "about" TEXT NOT NULL DEFAULT 'Пока ничего о себе не рассказал.',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Action" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "text" VARCHAR(255) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isDaily" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "normalizedText" VARCHAR(512) NOT NULL DEFAULT '',

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ActionMark" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "actionId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionMark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FriendRequest" (
    "id" SERIAL NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."FriendRequestStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subscriber" (
    "id" SERIAL NOT NULL,
    "subscriberId" INTEGER NOT NULL,
    "ownerId" INTEGER NOT NULL,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PotentialFriendView" (
    "id" SERIAL NOT NULL,
    "viewerId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PotentialFriendView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IgnoredUser" (
    "ignorerId" INTEGER NOT NULL,
    "ignoredId" INTEGER NOT NULL,

    CONSTRAINT "IgnoredUser_pkey" PRIMARY KEY ("ignorerId","ignoredId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Action_normalizedText_idx" ON "public"."Action"("normalizedText");

-- CreateIndex
CREATE INDEX "ActionMark_userId_idx" ON "public"."ActionMark"("userId");

-- CreateIndex
CREATE INDEX "ActionMark_actionId_idx" ON "public"."ActionMark"("actionId");

-- CreateIndex
CREATE INDEX "FriendRequest_senderId_idx" ON "public"."FriendRequest"("senderId");

-- CreateIndex
CREATE INDEX "FriendRequest_receiverId_idx" ON "public"."FriendRequest"("receiverId");

-- CreateIndex
CREATE INDEX "Subscriber_subscriberId_idx" ON "public"."Subscriber"("subscriberId");

-- CreateIndex
CREATE INDEX "Subscriber_ownerId_idx" ON "public"."Subscriber"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_subscriberId_ownerId_key" ON "public"."Subscriber"("subscriberId", "ownerId");

-- CreateIndex
CREATE INDEX "PotentialFriendView_viewerId_idx" ON "public"."PotentialFriendView"("viewerId");

-- CreateIndex
CREATE INDEX "PotentialFriendView_userId_idx" ON "public"."PotentialFriendView"("userId");

-- CreateIndex
CREATE INDEX "IgnoredUser_ignorerId_idx" ON "public"."IgnoredUser"("ignorerId");

-- CreateIndex
CREATE INDEX "IgnoredUser_ignoredId_idx" ON "public"."IgnoredUser"("ignoredId");

-- AddForeignKey
ALTER TABLE "public"."Action" ADD CONSTRAINT "Action_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActionMark" ADD CONSTRAINT "ActionMark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActionMark" ADD CONSTRAINT "ActionMark_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "public"."Action"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FriendRequest" ADD CONSTRAINT "FriendRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FriendRequest" ADD CONSTRAINT "FriendRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscriber" ADD CONSTRAINT "Subscriber_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscriber" ADD CONSTRAINT "Subscriber_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PotentialFriendView" ADD CONSTRAINT "PotentialFriendView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PotentialFriendView" ADD CONSTRAINT "PotentialFriendView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IgnoredUser" ADD CONSTRAINT "IgnoredUser_ignorerId_fkey" FOREIGN KEY ("ignorerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IgnoredUser" ADD CONSTRAINT "IgnoredUser_ignoredId_fkey" FOREIGN KEY ("ignoredId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
