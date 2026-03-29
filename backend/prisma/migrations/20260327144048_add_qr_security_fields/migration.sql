-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "is_qr_used" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "qr_code_token" TEXT;
