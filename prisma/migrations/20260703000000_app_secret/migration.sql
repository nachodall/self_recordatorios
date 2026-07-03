-- CreateTable
CREATE TABLE "AppSecret" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "vapidPublic" TEXT NOT NULL,
    "vapidPrivate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppSecret_pkey" PRIMARY KEY ("id")
);
