/*
  Warnings:

  - You are about to drop the column `cin` on the `utilisateurs` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `utilisateurs` table. All the data in the column will be lost.
  - You are about to drop the column `lbaraka_score` on the `utilisateurs` table. All the data in the column will be lost.
  - You are about to drop the column `palier` on the `utilisateurs` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `utilisateurs` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ModeEchange" AS ENUM ('DON_GRATUIT', 'PRET_TEMPORAIRE', 'LOCATION_SOLIDAIRE');

-- CreateEnum
CREATE TYPE "StatutTransaction" AS ENUM ('EN_ATTENTE_RECEPTION', 'EN_COURS', 'EN_ATTENTE_RETOUR', 'TERMINEE', 'ANNULEE', 'LITIGE_DEGRADATION');

-- CreateEnum
CREATE TYPE "CategorieAnnonce" AS ENUM ('POUSSETTE', 'BRICOLAGE', 'MEDICAL', 'EVENEMENTIEL', 'NOURRITURE', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeRelais" AS ENUM ('HANOUT', 'MOSQUEE', 'ASSOCIATION_QUARTIER');

-- CreateEnum
CREATE TYPE "TypeBadge" AS ENUM ('BIENVENUE', 'DONATEUR_BARAKA', 'SAUVEUR_ALIMENTAIRE', 'VOISIN_DE_CONFIANCE', 'AMBASSADEUR_LOCAL', 'GARANT_SOLIDAIRE', 'CHAMPION_ECO');

-- CreateEnum
CREATE TYPE "Langue" AS ENUM ('ARABE', 'FRANCAIS', 'AMAZIGH', 'BILINGUE');

-- CreateEnum
CREATE TYPE "StatutAnnonce" AS ENUM ('DISPONIBLE', 'RESERVEE', 'TERMINEE', 'EXPIREE');

-- CreateEnum
CREATE TYPE "ConditionAnnonce" AS ENUM ('NEUF', 'BON_ETAT', 'USE');

-- CreateEnum
CREATE TYPE "TypeMouvementWallet" AS ENUM ('DEPOT', 'BLOCAGE', 'DEBLOCAGE', 'RETRAIT');

-- DropIndex
DROP INDEX "utilisateurs_cin_key";

-- AlterTable
ALTER TABLE "utilisateurs" DROP COLUMN "cin",
DROP COLUMN "created_at",
DROP COLUMN "lbaraka_score",
DROP COLUMN "palier",
DROP COLUMN "updated_at",
ADD COLUMN     "date_inscription" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "profils" (
    "id" TEXT NOT NULL,
    "nom" TEXT,
    "prenom" TEXT,
    "cin" TEXT,
    "adresse_complete" TEXT,
    "ville" TEXT,
    "lbaraka_score" INTEGER NOT NULL DEFAULT 0,
    "palier" "NiveauTier" NOT NULL DEFAULT 'BRONZE',
    "badges" "TypeBadge"[],
    "langue_interface" "Langue" NOT NULL DEFAULT 'FRANCAIS',
    "photo_profil" TEXT,
    "date_naissance" TIMESTAMP(3),
    "utilisateur_id" TEXT NOT NULL,

    CONSTRAINT "profils_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annonces" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categorie" "CategorieAnnonce" NOT NULL,
    "mode" "ModeEchange" NOT NULL,
    "prix_symbolique" DECIMAL(12,2),
    "montant_caution" DECIMAL(12,2),
    "photos" TEXT[],
    "geolocalisation" DOUBLE PRECISION[],
    "est_food_rescue" BOOLEAN NOT NULL DEFAULT false,
    "date_expiration" TIMESTAMP(3),
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "StatutAnnonce" NOT NULL DEFAULT 'DISPONIBLE',
    "nombre_vues" INTEGER NOT NULL DEFAULT 0,
    "condition" "ConditionAnnonce" NOT NULL,
    "createur_id" TEXT NOT NULL,

    CONSTRAINT "annonces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portefeuilles" (
    "id" TEXT NOT NULL,
    "solde_reel" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "solde_bloque" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "devise" TEXT NOT NULL DEFAULT 'MAD',
    "date_mise_a_jour" TIMESTAMP(3) NOT NULL,
    "utilisateur_id" TEXT NOT NULL,

    CONSTRAINT "portefeuilles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mouvements_wallet" (
    "id" TEXT NOT NULL,
    "montant" DECIMAL(14,2) NOT NULL,
    "type" "TypeMouvementWallet" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "utilisateur_id" TEXT NOT NULL,
    "portefeuille_id" TEXT NOT NULL,

    CONSTRAINT "mouvements_wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_relais" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeRelais" NOT NULL,
    "capacite_stockage" INTEGER NOT NULL,
    "adresse" TEXT NOT NULL,
    "geolocalisation" DOUBLE PRECISION[],
    "horaires" TEXT[],
    "telephone" TEXT NOT NULL,
    "photo" TEXT,

    CONSTRAINT "points_relais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "annonce_id" TEXT NOT NULL,
    "emprunteur_id" TEXT NOT NULL,
    "preteur_id" TEXT NOT NULL,
    "qr_code_reception" TEXT,
    "qr_code_retour" TEXT,
    "statut" "StatutTransaction" NOT NULL DEFAULT 'EN_ATTENTE_RECEPTION',
    "date_debut" TIMESTAMP(3),
    "date_fin_prevue" TIMESTAMP(3),
    "date_fin_reelle" TIMESTAMP(3),
    "montant_caution_bloquee" DECIMAL(14,2),
    "point_relais_id" TEXT,
    "scanned_reception" BOOLEAN NOT NULL DEFAULT false,
    "scanned_retour" BOOLEAN NOT NULL DEFAULT false,
    "retard" INTEGER NOT NULL DEFAULT 0,
    "degats" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contrats" (
    "id" TEXT NOT NULL,
    "num_contrat" TEXT NOT NULL,
    "url_pdf_bilingue" TEXT NOT NULL,
    "hash_signature" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "date_generation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "langue" "Langue" NOT NULL DEFAULT 'BILINGUE',

    CONSTRAINT "contrats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profils_cin_key" ON "profils"("cin");

-- CreateIndex
CREATE UNIQUE INDEX "profils_utilisateur_id_key" ON "profils"("utilisateur_id");

-- CreateIndex
CREATE UNIQUE INDEX "portefeuilles_utilisateur_id_key" ON "portefeuilles"("utilisateur_id");

-- CreateIndex
CREATE UNIQUE INDEX "contrats_num_contrat_key" ON "contrats"("num_contrat");

-- CreateIndex
CREATE UNIQUE INDEX "contrats_transaction_id_key" ON "contrats"("transaction_id");

-- AddForeignKey
ALTER TABLE "profils" ADD CONSTRAINT "profils_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonces" ADD CONSTRAINT "annonces_createur_id_fkey" FOREIGN KEY ("createur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portefeuilles" ADD CONSTRAINT "portefeuilles_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mouvements_wallet" ADD CONSTRAINT "mouvements_wallet_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mouvements_wallet" ADD CONSTRAINT "mouvements_wallet_portefeuille_id_fkey" FOREIGN KEY ("portefeuille_id") REFERENCES "portefeuilles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_annonce_id_fkey" FOREIGN KEY ("annonce_id") REFERENCES "annonces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_emprunteur_id_fkey" FOREIGN KEY ("emprunteur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_preteur_id_fkey" FOREIGN KEY ("preteur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_point_relais_id_fkey" FOREIGN KEY ("point_relais_id") REFERENCES "points_relais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrats" ADD CONSTRAINT "contrats_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
