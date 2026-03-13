-- CreateEnum
CREATE TYPE "RoleUtilisateur" AS ENUM ('CITOYEN', 'PARTENAIRE', 'ADMINISTRATEUR');

-- CreateEnum
CREATE TYPE "NiveauTier" AS ENUM ('BRONZE', 'ARGENT', 'OR', 'LEGENDE');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "cin" TEXT,
    "mot_de_passe_hash" TEXT NOT NULL,
    "role" "RoleUtilisateur" NOT NULL DEFAULT 'CITOYEN',
    "lbaraka_score" INTEGER NOT NULL DEFAULT 0,
    "palier" "NiveauTier" NOT NULL DEFAULT 'BRONZE',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "telephone_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_telephone_key" ON "utilisateurs"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_cin_key" ON "utilisateurs"("cin");
