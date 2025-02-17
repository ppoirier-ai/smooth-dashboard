/*
  Warnings:

  - A unique constraint covering the columns `[viewToken]` on the table `BinanceAccount` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `viewToken` to the `BinanceAccount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BinanceAccount" ADD COLUMN     "viewToken" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "BinanceAccount_viewToken_key" ON "BinanceAccount"("viewToken");
