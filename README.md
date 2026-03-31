# 🤝 LBaraka - Plateforme Solidaire de Prêt et de Partage

## 📖 Description Globale
**LBaraka** est une application mobile complète développée en **React Native (Expo)**, adossée à une API **NestJS** puissante. Le but du projet est de faciliter l'échange, le prêt (gratuit) et la location à bas coût d'objets ou de matériel entre particuliers. 

Afin de garantir un maximum de sécurité et de confiance, la plateforme intègre un système de **"Points Relais"**, un portefeuille virtuel pour la consignation (**Wallet / Cautions**), la signature dynamique de **Contrats bilingues en PDF**, un chat en temps réel et un système de scanners **QR Code** pour certifier de la remise des objets.

---

## 🧰 Stack Technologique

### 1. Backend (`/backend`)
*   **Framework principal** : NestJS (Architecture Modular Monolith)
*   **Base de Données Relationnelle** : PostgreSQL (connectée via l'ORM *Prisma*) - _Gère les Utilisateurs, Annonces, Wallets, Transactions et Contrats._
*   **Base de Données NoSQL** : MongoDB (connectée via l'ODM *Mongoose*) - _Gère le stockage persistant de la messagerie instantanée (Chat)._
*   **Temps Réel** : `@nestjs/platform-socket.io` pour la messagerie.
*   **Stockage de Fichiers (S3)** : MinIO pour l'hébergement d'images (photos des objets) et de l'audio (notes vocales du chat).
*   **Authentification** : JWT, Guards de configuration NestJS, `bcrypt` (Mot de passe).
*   **Génération de PDF** : `html-pdf-node` piloté par des templates *Handlebars* (HBS).
*   **Validation & Typage** : Systématique grâce à `class-validator` et TypeScript.

### 2. Frontend Mobile (`/mobile`)
*   **Framework** : React Native via Expo (SDK 54+ | Native Architecture / Expo Router).
*   **Stylisation UI** : Nativewind (TailwindCSS configuré pour mobile) misant sur un Dark Mode élégant.
*   **Requêtage Réseau** : API Fetch native avec intercepteur maison traitant finement les URL dev (`localhost` vs `10.0.2.2`).

### 3. DevOps & CI/CD
*   **Conteneurisation (Local)** : Docker avec `docker-compose.yml` incluant : *PostgreSQL, MongoDB, MinIO* et le serveur NestJS en standalone.
*   **Pipeline CI/CD** : GitHub Actions (`.github/workflows/ci.yml`) - Analyse, compilation, exécution de Tests unitaires et construction d'APK via EAS (Expo Application Services).

---

## 🏗️ Architecture Fonctionnelle (Modules)

1.  🔐 **Auth & Users** : Inscription, Connexion JWT, Gestion dynamique des rôles (Admin, Utilisateur, Partenaire) et du score social (`LBaraka Score`).
2.  📦 **Annonces (Items)** : CRUD des objets proposés. Supporte jusqu'à 3 images (Upload Minio) et la classification par modes (Don, Prêt, Location).
3.  🔄 **Transactions & Réservations** : Véritable machine à statuts gérant le cycle de vie d'une location (Publiée, Réservée, Confirmée, Retirée, Retournée, Terminée).
4.  💳 **Wallet & Caution** : Suivi des soldes financiers (Solde Réel, Solde Bloqué). Bloque automatiquement la somme correspondante à une "caution" lors d'une réservation pour protéger le prêteur.
5.  📄 **Contrats** : Numérisation des termes d'un échange avec génération de facture/contrat PDF dynamique automatisé.
6.  📱 **QR Code** : Génération et validation unique de codes-barres 2D pour attester physiquement du retrait ou du retour de matériel dans un *Point Relais*.
7.  💬 **Chat** : Communication temps réel entre offreur et demandeur. Intègre l'envoi de messages texte et de notes vocales hébergées.
8.  🥗 **Food-Rescue** : Module secondaire simplifié dédié au sauvetage (Anti-Gaspillage) de paniers repas.
9.  👑 **Admin Dashboard** : Espace exclusif aux administrateurs permettant la vue d'ensemble des statistiques, du chiffre d’affaires (Impact écologique/financier), et la manipulation des profils (Bannissement, Upgrade de Rôle).

---

## 🚀 Guide d'Installation & Lancement Local

### Étape 1 : Prérequis système
*   **Node.js** (v20 recommandeé)
*   **Docker Desktop** (pour les bases de données et Minio)
*   L'application **Expo Go** (Optionnelle) ou la plateforme Android Studio.

### Étape 2 : Préparation de l'infrastructure
Montez les services des bases de données de manière asynchrone à la racine :
```bash
docker-compose up -d postgres mongo minio
```

### Étape 3 : Démarrer l'API (Backend)
```bash
cd backend
npm install --legacy-peer-deps  # Pour bypasser nativement de possibles conflits liés à NestJS
```

**Variables d'environnement (.env)** : Ajoutez le fichier `.env` indispensable dans le dossier backend :
```env
DATABASE_URL=postgresql://postgres:lbaraka@localhost:5432/lbaraka?schema=public
MONGODB_URL=mongodb://localhost:27017/lbaraka
JWT_SECRET=lbaraka_secret_key_dev
JWT_EXPIRES_IN=7d
PORT=3000

# MinIO Config
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=lbaraka
MINIO_SECRET_KEY=lbaraka123
MINIO_BUCKET=lbaraka-annonces
MINIO_PUBLIC_URL=http://localhost:9000
```

Lancez ensuite les migrations et démarrez l'API :
```bash
npx prisma generate  # Génère l'interface Prisma TypeScript
npx prisma db push   # Crée les tables dans PostgreSQL

npm run start:dev    # Lance en mode développement (Hot Reload)
```

### Étape 4 : Déploiement du Frontend (Mobile)
```bash
cd mobile
npm install
```
Ajustez si nécessaire l'adresse IP globale dans la configuration de vos clients HTTP (`API_URL` dans les hooks) pour pointer vers l'adresse LAN de la machine exécutant votre backend si vous testez depuis un smartphone physique !
```bash
npx expo start -c
```

---

## 🧪 Tests Techniques
La plateforme backend repose sur de solides tests unitaires automatisés utilisant **Jest**. Mongoose et Prisma ont été mockés pour assurer le plus de légèreté et des validations sans connexion BD.
```bash
cd backend
npm run test
```

## 📜 Règles de développement de la Team (Convention de code)
- **KISS (Keep It Simple, Stupid)** : Privilégier la verbose explicite à un code *over-engineeré*. Toujours utiliser un simple `if/else` plutôt que du *bit-shifting* ou des triples ternaires compliquées.
- **Séparation stricte (MVC/Modulaire)** : Les *Controllers* ne s'occupent que de Router et ne contiennent pas de logique métier. Toute l'intelligence métier réside exclusivement dans la couche *Service*. Chaque requête subit une Validation fine via des DTOs stricts en amont.
- **Fail Fast (Exceptions)** : Levée immédiate d'Exceptions Built-in HTTP NestJS en cas de paramétrage manquant.

---
*(Développé par Abdelhakim Baalla YouCode)*
