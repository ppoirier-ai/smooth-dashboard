/*
  Warnings:

  - You are about to drop the column `accountName` on the `BinanceAccount` table. All the data in the column will be lost.
  - You are about to drop the column `accountType` on the `BinanceAccount` table. All the data in the column will be lost.
  - You are about to drop the column `apiKey` on the `BinanceAccount` table. All the data in the column will be lost.
  - You are about to drop the column `viewToken` on the `BinanceAccount` table. All the data in the column will be lost.
  - Added the required column `apiKeyId` to the `BinanceAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `encryptedKey` to the `BinanceAccount` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "BinanceAccount_userId_accountName_key";

-- DropIndex
DROP INDEX "BinanceAccount_viewToken_key";

-- AlterTable
ALTER TABLE "BinanceAccount" DROP COLUMN "accountName",
DROP COLUMN "accountType",
DROP COLUMN "apiKey",
DROP COLUMN "viewToken",
ADD COLUMN     "apiKeyId" TEXT NOT NULL,
ADD COLUMN     "encryptedKey" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BinanceAccount" ADD CONSTRAINT "BinanceAccount_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
