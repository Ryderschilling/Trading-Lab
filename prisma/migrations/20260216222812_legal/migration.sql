-- AlterTable
ALTER TABLE "trades" ALTER COLUMN "tradeDate" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "acceptedAIPolicyAt" TIMESTAMP(3),
ADD COLUMN     "acceptedDisclaimerAt" TIMESTAMP(3),
ADD COLUMN     "acceptedPrivacyAt" TIMESTAMP(3),
ADD COLUMN     "acceptedTermsAt" TIMESTAMP(3);
