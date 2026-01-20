/*
  Warnings:

  - You are about to drop the column `afternoonPnl` on the `aggregated_stats` table. All the data in the column will be lost.
  - You are about to drop the column `eveningPnl` on the `aggregated_stats` table. All the data in the column will be lost.
  - You are about to drop the column `morningPnl` on the `aggregated_stats` table. All the data in the column will be lost.
  - You are about to drop the column `timeOfDay` on the `option_metadata` table. All the data in the column will be lost.
  - You are about to drop the column `tradeTime` on the `trades` table. All the data in the column will be lost.
  - Added the required column `uploadId` to the `broker_executions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "aggregated_stats" DROP COLUMN "afternoonPnl",
DROP COLUMN "eveningPnl",
DROP COLUMN "morningPnl";

-- AlterTable
ALTER TABLE "broker_executions" ADD COLUMN     "uploadId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "option_metadata" DROP COLUMN "timeOfDay",
ALTER COLUMN "expirationDate" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "trades" DROP COLUMN "tradeTime",
ALTER COLUMN "tradeDate" SET DATA TYPE DATE;
