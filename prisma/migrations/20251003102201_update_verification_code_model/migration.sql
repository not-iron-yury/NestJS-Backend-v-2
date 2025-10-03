/*
  Warnings:

  - You are about to drop the column `provider` on the `verification_codes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."verification_codes" DROP COLUMN "provider";

-- DropEnum
DROP TYPE "public"."VerificationProvider";
