/*
  Warnings:

  - You are about to alter the column `prix_symbolique` on the `annonces` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(10,2)`.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RoleUtilisateur" ADD VALUE 'PARTENAIRES';
ALTER TYPE "RoleUtilisateur" ADD VALUE 'PARTENAIRE_ADMIN';
ALTER TYPE "RoleUtilisateur" ADD VALUE 'PARTENAIRE_SUPER_ADMIN';
ALTER TYPE "RoleUtilisateur" ADD VALUE 'POINT_RELAIS';
ALTER TYPE "RoleUtilisateur" ADD VALUE 'POINT_RELAIS_ADMIN';
ALTER TYPE "RoleUtilisateur" ADD VALUE 'POINT_RELAIS_SUPER_ADMIN';

-- AlterTable
ALTER TABLE "annonces" ALTER COLUMN "prix_symbolique" SET DATA TYPE DECIMAL(10,2);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "utilisateur_id" TEXT NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
