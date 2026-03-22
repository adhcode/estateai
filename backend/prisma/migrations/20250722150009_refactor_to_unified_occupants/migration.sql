/*
  Warnings:

  - You are about to drop the column `householdMemberId` on the `visitor_codes` table. All the data in the column will be lost.
  - You are about to drop the column `residentId` on the `visitor_codes` table. All the data in the column will be lost.
  - You are about to drop the `household_members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `residents` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "OccupantType" AS ENUM ('RESIDENT', 'HOUSEHOLD_MEMBER');

-- DropForeignKey
ALTER TABLE "household_members" DROP CONSTRAINT "household_members_estateId_fkey";

-- DropForeignKey
ALTER TABLE "household_members" DROP CONSTRAINT "household_members_residentId_fkey";

-- DropForeignKey
ALTER TABLE "household_members" DROP CONSTRAINT "household_members_unitId_fkey";

-- DropForeignKey
ALTER TABLE "residents" DROP CONSTRAINT "residents_estateId_fkey";

-- DropForeignKey
ALTER TABLE "residents" DROP CONSTRAINT "residents_unitId_fkey";

-- DropForeignKey
ALTER TABLE "visitor_codes" DROP CONSTRAINT "visitor_codes_householdMemberId_fkey";

-- DropForeignKey
ALTER TABLE "visitor_codes" DROP CONSTRAINT "visitor_codes_residentId_fkey";

-- AlterTable
ALTER TABLE "visitor_codes" DROP COLUMN "householdMemberId",
DROP COLUMN "residentId",
ADD COLUMN     "occupantId" TEXT;

-- DropTable
DROP TABLE "household_members";

-- DropTable
DROP TABLE "residents";

-- CreateTable
CREATE TABLE "occupants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "estateId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "type" "OccupantType" NOT NULL DEFAULT 'RESIDENT',
    "primaryOccupantId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "occupants_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "occupants" ADD CONSTRAINT "occupants_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupants" ADD CONSTRAINT "occupants_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupants" ADD CONSTRAINT "occupants_primaryOccupantId_fkey" FOREIGN KEY ("primaryOccupantId") REFERENCES "occupants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_codes" ADD CONSTRAINT "visitor_codes_occupantId_fkey" FOREIGN KEY ("occupantId") REFERENCES "occupants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
