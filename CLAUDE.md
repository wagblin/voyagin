# VoyagIn

## Vision produit

Carnet de voyage collaboratif en temps réel + planification flexible + carte photo interactive. "Le In compte" : VoyagIn capture le voyage **pendant** qu'il se déroule, pas seulement en le planifiant à l'avance.

- **Avant / pendant le voyage** : les utilisateurs (couple, groupe) définissent envies, contraintes (dates, budget, envie d'improviser), et les grands axes de l'itinéraire.
- **Pendant le voyage** : carnet de voyage en direct — capture photo/lieu/heure en temps réel, ajustement du planning à la volée, collaboration multi-user synchronisée entre appareils.
- **Après le voyage** : archive permanente — carte interactive avec chronologie photo, histoire partageable.

Fonctionnalités V1 visées (au-delà du slice actuel) : carte interactive (tracking + épingles photo), journal photo horodaté/géolocalisé, itinéraire flexible, mode hors-ligne d'abord avec sync, gestion financière (inspirée d'une note "Comptes" existante), organisation d'excursions avec temps de trajet/sur site/retour et contraintes locales (ex. pas de route la nuit), infos pratiques locales (électricité, eau, monnaie, langue, sécurité, zones climatiques/mer).

## Stack technique (cible complète — voir état actuel du repo pour ce qui existe déjà)

| Domaine | Choix |
|---|---|
| Mobile | React Native + Expo |
| Web | React + Vite |
| UI | shadcn/ui + Tailwind CSS |
| State (client) | TanStack Query |
| Offline DB | SQLite (Expo SQLite) + PowerSync |
| Backend runtime | Node.js + Express |
| ORM | Prisma |
| Database | PostgreSQL |
| Validation | Zod |
| Testing | Jest (+ Supertest côté backend) |
| Auth | JWT (`jsonwebtoken`) |
| Langage | TypeScript strict partout |
| Hébergement API | Railway / Render |
| Frontend web hosting | Vercel / Netlify |
| Mobile build | EAS Build (Expo) |
| CI/CD | GitHub Actions |
| Monitoring | Sentry |

**État actuel du repo** : monorepo pnpm + Turborepo avec `packages/domain` (coeur métier DDD) et `packages/backend` (Express/Prisma). `packages/web` et `packages/mobile` n'existent pas encore — à scaffolder dans une passe suivante.

## Décisions architecturales (non négociables)

- **Monorepo** pnpm workspaces + Turborepo, TypeScript strict (`tsconfig.base.json` à la racine, étendu par chaque package).
- **Architecture hexagonale (Ports & Adapters)** : le domaine métier (`packages/domain`) ne dépend d'aucune infra (pas d'Express, pas de Prisma, pas de framework HTTP). Les ports (interfaces, ex. `TripRepository`) sont définis dans le domaine ; les adapters (Prisma, HTTP Express, futurs adapters mobile/web) vivent dans les packages d'infrastructure et implémentent ces ports.
- **DDD** : agrégats, value objects et erreurs de domaine typées vivent dans `packages/domain/src/<contexte>/`. Un agrégat expose `create()` (validé, invariants) et éventuellement `reconstitute()` (rehydratation depuis la persistance, sans re-validation) — voir `Trip.ts` comme référence.
- **Clean code** (Robert C. Martin) : nommage expressif, fonctions courtes, responsabilité unique, pas de commentaires qui expliquent le "quoi" (le code doit se lire comme de la prose).
- **TDD strict — Red → Green → Refactor** : toujours écrire le test avant le code de production. Ne jamais écrire de code d'implémentation sans un test en échec qui le justifie. **100% de couverture sur `packages/domain`** (`coverageThreshold` configuré dans `jest.config.ts`, échoue le build sinon).
- **Hors-ligne d'abord** avec PowerSync (à intégrer lors du scaffold mobile/web).
- Pas de raccourcis "temporaires", pas d'abstraction anticipée sur des besoins hypothétiques.

## Structure des packages

```
packages/
  domain/     # coeur métier pur — agrégats, VOs, ports, use cases (application layer)
    src/<contexte>/         # ex: trip/
      <Aggregate>.ts
      <ValueObject>.ts
      <Port>Repository.ts   # interface
      In-Memory<Port>Repository.ts  # implémentation pure, sans I/O réel — utilisée en test ET par le backend en dev léger
      <UseCase>.ts
      errors.ts
      __tests__/
  backend/    # adapters d'infrastructure
    src/
      adapters/http/        # controllers + routes Express
      adapters/persistence/ # implémentations Prisma des ports du domaine
      infrastructure/       # bootstrap app/serveur, client Prisma
    prisma/schema.prisma
```

Règle : un nouvel adapter d'infra (Prisma, HTTP, etc.) va dans `backend/src/adapters/`, jamais dans `domain`. Un nouvel adapter **sans dépendance externe réelle** (in-memory, fake) peut vivre dans `domain` à côté du port qu'il implémente, car il ne viole pas la pureté du domaine.

## Commandes

```bash
pnpm install                      # installe tout le monorepo
pnpm turbo run typecheck lint test   # pipeline complet (utilisé aussi par la CI)
pnpm turbo run test:coverage      # coverage (100% requis sur domain)

# Backend seul
cd packages/backend
npx prisma generate               # après toute modif de prisma/schema.prisma
npx prisma migrate dev            # nécessite DATABASE_URL (voir docker-compose.yml)
pnpm dev                          # lance le serveur (ts-node-dev)
```

Un `docker-compose.yml` à la racine fournit un Postgres local (`voyagin`/`voyagin`) pour le dev — non démarré automatiquement.

## Workflow à 2 agents Claude Code

Deux subagents dans `.claude/agents/` reproduisent le mode de travail décrit par l'utilisateur :

- **`architecte`** : à invoquer pour démarrer une nouvelle fonctionnalité ou un nouveau slice de domaine. Explore le contexte existant, définit les ports/interfaces et les invariants, écrit les tests en échec (Red) — **n'écrit jamais de code de production**.
- **`developpeur`** : à invoquer une fois que des tests en échec existent. Implémente le minimum de code pour les faire passer (Green), puis refactore en gardant la suite verte. Respecte les frontières hexagonales posées par l'architecte.

Usage typique : `architecte` d'abord sur une feature, puis `developpeur` pour l'implémentation, en gardant `pnpm turbo run test` vert à chaque étape.

## Déploiement (pas encore connecté)

CI GitHub Actions (`.github/workflows/ci.yml`) : lint + typecheck + test sur push/PR. Le déploiement (Railway/Render pour l'API, Vercel/Netlify pour le web, EAS pour le mobile) nécessite des comptes/secrets que je n'ai pas — à brancher avec l'utilisateur quand ces services seront prêts. Ne pas inventer de credentials ni de config de déploiement non demandée.
