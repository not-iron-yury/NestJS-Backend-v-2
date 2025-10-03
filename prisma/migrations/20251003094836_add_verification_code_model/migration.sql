/*
  Warnings:

  - You are about to drop the `_UserRoles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."VerificationProvider" AS ENUM ('EMAIL', 'SMS', 'GOOGLE', 'GITHUB');

-- DropForeignKey
ALTER TABLE "public"."_UserRoles" DROP CONSTRAINT "_UserRoles_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_UserRoles" DROP CONSTRAINT "_UserRoles_B_fkey";

-- DropTable
DROP TABLE "public"."_UserRoles";

-- DropTable
DROP TABLE "public"."roles";

-- CreateTable
CREATE TABLE "public"."verification_codes" (
    "id" TEXT NOT NULL,
    "authAccountId" TEXT NOT NULL,
    "provider" "public"."VerificationProvider" NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verification_codes_authAccountId_key" ON "public"."verification_codes"("authAccountId");

-- AddForeignKey
ALTER TABLE "public"."verification_codes" ADD CONSTRAINT "verification_codes_authAccountId_fkey" FOREIGN KEY ("authAccountId") REFERENCES "public"."auth_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
