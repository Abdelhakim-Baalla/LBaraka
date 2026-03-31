# LBaraka Project — Agent Rules

## Contexte
Tu travailles sur LBaraka, une app mobile React Native + NestJS backend.
Développeur : étudiant YouCode 2ème année, niveau intermédiaire.
Deadline : 01/04/2026. Priorité absolue : code simple qui fonctionne.

## Stack exacte — ne jamais dévier
- Backend : NestJS (Modular Monolith)
- ORM : Prisma + PostgreSQL pour User/Annonce/Wallet/Contract/Transaction
- ODM : Mongoose + MongoDB pour Message (chat) et Logs (si nécessaire)
- Mobile : React Native + Expo SDK 54+
- Realtime : Socket.io (@nestjs/platform-socket.io)
- PDF : html-pdf-node + Handlebars templates
- Auth : JWT (@nestjs/jwt) + bcrypt + Passport
- Validation : class-validator + class-transformer (sur tous les DTOs)
- Fichiers : MinIO pour le stockage des objets (en remplacement de Cloudinary)
- Docker : docker-compose.yml avec postgres, mongo, redis, minio, backend

## Référence Produit
- **Cahier des charges** : `agent/CAHIER DES CHARGES - LBARAKA.docx`
- TOUJOURS se référer à ce document pour comprendre les règles métiers, les statuts et le workflow global avant de prendre une décision d'architecture fonctionnelle.

## Règle Absolue : Niveau Débutant (Beginner)
- Tu DOIS coder comme un **développeur débutant/junior**.
- N'utilise jamais de syntaxe avancée (pas de Proxy, pas de Generics ou Typescripts complexes, pas d'opérateurs bitwise).
- Fais des fonctions très simples : étape par étape (Step-by-Step).
- Privilégie la lisibilité avec du code verbeux facile à comprendre plutôt que du "code golf" optimisé mais illisible.
- Toujours privilégier `if/else` plutôt que des ternaires imbriquées compliquées.

## Règles de code — OBLIGATOIRES

### Simplicité avant tout
- Écris le code le plus simple qui résout le problème
- Maximum 30 lignes par méthode de service (si possible)
- Pas de patterns avancés : pas de CQRS, pas d'Event Sourcing, pas de Saga
- Pas de generics complexes que le développeur ne peut pas lire
- Si une solution a 2 approches, choisis toujours la plus simple

### Structure des fichiers NestJS
Pour chaque module, génère dans cet ordre exact :
1. Mise à jour de `schema.prisma` (au lieu d'entités TypeORM séparées)
2. `create-nom.dto.ts` + `update-nom.dto.ts`
3. `nom.service.ts`
4. `nom.controller.ts`
5. `nom.module.ts`

### Nommage — règles strictes
- Fichiers : kebab-case (user.service.ts, create-item.dto.ts)
- Classes : PascalCase (UserService, CreateItemDto)
- Variables/méthodes : camelCase (userId, createItem)
- Constants : UPPER_SNAKE_CASE (JWT_SECRET, MAX_CAUTION)
- Pas de noms ambigus : data, info, temp, result → utilise userId, itemData, tempPath

### Validation — toujours sur les DTOs
```typescript
import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional } from 'class-validator';
```
Chaque DTO doit avoir tous ses champs validés. Jamais de DTO vide.

### Error Handling — pattern obligatoire dans les services
```typescript
async createItem(dto: CreateItemDto): Promise<any> {
  try {
    // logique ici
  } catch (error) {
    throw new InternalServerErrorException('Failed to create item');
  }
}
```
Utilise les exceptions NestJS : `NotFoundException`, `BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `InternalServerErrorException`

### Controllers — rules
- Pas de logique dans les controllers
- Juste : validation + appel service + retour réponse
- Toujours `@UseGuards(JwtAuthGuard)` sur les routes protégées

### Services — rules
- Toute la logique business est ici
- Injecter `PrismaService` via constructor
- Une méthode = une responsabilité (SRP)
- Jamais copier-coller du code entre services (DRY) → créer un helper

### React Native / Expo — rules
- Utilise l'architecture en place
- Fetch API (via `src/api/client.ts`) personnalisé pour les appels API (gérant les URI Android/Web)
- Toujours gérer les états : loading, error, success

### Docker
Le `docker-compose.yml` doit toujours inclure :
- postgres:15-alpine avec `POSTGRES_DB=lbaraka`
- mongo:7 
- minio/minio pour le stockage local (S3 compatible)
- backend NestJS avec hot-reload en dev
- Variables d'environnement dans `.env` (jamais hardcodées)

## Ce que tu NE dois PAS faire
- Ne pas générer de tests unitaires (pas le temps)
- Ne pas utiliser des décorateurs personnalisés complexes
- Ne pas créer des abstractions inutiles (base.repository.ts, etc.)
- Ne pas utiliser Bull Queue pour les jobs simples (utilise @nestjs/schedule)
- Ne pas sur-commenter le code — le code doit être auto-documenté
- Ne pas créer de fichiers de plus de 150 lignes si possible
- Ne pas utiliser interceptors complexes pour des transformations simples

## Ordre de travail (respecte cet ordre)
1. Auth Module (Register + Login + JWT Guard)
2. Users Module (Profile + LBaraka Score)
3. Items Module (CRUD + 3 photos + 3 modes)
4. Reservations/Transactions Module (workflow status machine)
5. Wallet Module (balance + caution blocage)
6. Contracts Module (PDF bilingue Handlebars)
7. QR Module (génération + validation)
8. Chat Module (Socket.io + MongoDB)
9. Food-Rescue Module (simplifié)
10. Admin Module (stats uniquement)

## Quand tu génères du code
1. Dis en 1 ligne ce que tu vas générer
2. Génère le fichier COMPLET (pas de "// reste du code ici")
3. Indique les imports nécessaires en haut
4. Si un package est nécessaire : donne la commande `npm install` exacte
5. À la fin du fichier : indique le prochain fichier à créer

## Variables d'environnement requises (.env)
```env
DATABASE_URL=postgresql://postgres:lbaraka@localhost:5432/lbaraka?schema=public
MONGODB_URL=mongodb://localhost:27017/lbaraka
JWT_SECRET=lbaraka_secret_key_dev
JWT_EXPIRES_IN=7d
PORT=3000

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=lbaraka
MINIO_SECRET_KEY=lbaraka123
MINIO_BUCKET=lbaraka-annonces
MINIO_PUBLIC_URL=http://localhost:9000
```
