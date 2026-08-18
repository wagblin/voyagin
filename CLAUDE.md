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

**État actuel du repo** : monorepo pnpm + Turborepo avec `packages/domain` (coeur métier DDD), `packages/backend` (Express/Prisma), `packages/web` (Vite + React + Tailwind v4 + shadcn/ui + TanStack Query) et `packages/mobile` (Expo + React Native + TanStack Query). Web et mobile appellent chacun `GET /api/health` sur le backend via un hook `useHealth` (preuve de connectivité bout-en-bout) ; ni l'un ni l'autre n'a encore de logique métier — le domaine (agrégat `Trip`) n'est consommé pour l'instant que par le backend.

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
  web/        # Vite + React + TS (strict) + Tailwind v4 + shadcn/ui + TanStack Query
    src/
      components/ui/   # composants shadcn (copiés, pas de logique métier)
      hooks/            # hooks TanStack Query, ex: useHealth — __tests__/ avec Vitest + Testing Library
      lib/              # utils.ts (cn), apiClient.ts (VITE_API_URL)
  mobile/     # Expo + React Native + TS (strict) + TanStack Query
    src/
      hooks/            # même pattern que web — __tests__/ avec jest-expo + Testing Library
      lib/              # apiClient.ts (EXPO_PUBLIC_API_URL)
    App.tsx importé depuis index.ts (registerRootComponent)
```

Règle : un nouvel adapter d'infra (Prisma, HTTP, etc.) va dans `backend/src/adapters/`, jamais dans `domain`. Un nouvel adapter **sans dépendance externe réelle** (in-memory, fake) peut vivre dans `domain` à côté du port qu'il implémente, car il ne viole pas la pureté du domaine.

Web et mobile n'importent pas encore `@voyagin/domain` directement (ils ne font que de l'appel HTTP via des hooks TanStack Query). Le jour où une vraie logique métier doit être partagée entre eux (validation de formulaire, formatage d'un agrégat, etc.), envisager un `packages/shared` plutôt que de dupliquer — ne pas le créer avant d'en avoir un besoin réel.

`packages/mobile` contient un `AGENTS.md` généré par Expo (`@AGENTS.md` référencé depuis son propre `CLAUDE.md`) qui rappelle de vérifier la doc versionnée du SDK Expo installé avant d'écrire du code RN — le lire avant de toucher à du code mobile spécifique à l'API Expo.

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

# Web seul (attend le backend sur http://localhost:3000, voir packages/web/.env.example)
pnpm --filter @voyagin/web dev

# Mobile seul (Expo — voir packages/mobile/.env.example pour EXPO_PUBLIC_API_URL)
pnpm --filter @voyagin/mobile start
```

Un `docker-compose.yml` à la racine fournit un Postgres local (`voyagin`/`voyagin`) pour le dev — non démarré automatiquement.

### Tester depuis un téléphone/tablette physique sur le même Wi-Fi

`localhost` dans `packages/web/.env` (`VITE_API_URL`) ou `packages/mobile/.env` (`EXPO_PUBLIC_API_URL`) désigne l'appareil qui exécute le navigateur/l'app — pas la machine de dev. Pour tester depuis un iPhone/iPad :
1. Récupérer l'IP LAN de la machine de dev : `ipconfig getifaddr en0` (Wi-Fi, macOS).
2. Mettre cette IP dans `VITE_API_URL` / `EXPO_PUBLIC_API_URL` (au lieu de `localhost`), puis relancer web/mobile.
3. Lancer le backend avec `HOST=0.0.0.0` (déjà la valeur par défaut dans `server.ts`) et Vite avec `--host 0.0.0.0` pour qu'ils écoutent sur toutes les interfaces, pas seulement `127.0.0.1`.
4. Expo (`expo start`) et Prisma Studio (`prisma studio`) écoutent déjà sur toutes les interfaces par défaut.
5. Expo Go (App Store) ne supporte que la dernière version de SDK Expo publiée — si `expo start` affiche "Project is incompatible with this version of Expo Go", c'est que le SDK du projet est plus récent que ce que Expo Go supporte : rétrograder (`npx expo install expo@^<version>` puis `npx expo install --fix`) plutôt que d'attendre une mise à jour de l'app.

L'IP change selon le réseau — la reconfirmer (`ipconfig getifaddr en0`) si le Wi-Fi change.

## Workflow à 2 agents Claude Code

Deux subagents dans `.claude/agents/` reproduisent le mode de travail décrit par l'utilisateur :

- **`architecte`** : à invoquer pour démarrer une nouvelle fonctionnalité ou un nouveau slice de domaine. Explore le contexte existant, définit les ports/interfaces et les invariants, écrit les tests en échec (Red) — **n'écrit jamais de code de production**.
- **`developpeur`** : à invoquer une fois que des tests en échec existent. Implémente le minimum de code pour les faire passer (Green), puis refactore en gardant la suite verte. Respecte les frontières hexagonales posées par l'architecte.

Usage typique : `architecte` d'abord sur une feature, puis `developpeur` pour l'implémentation, en gardant `pnpm turbo run test` vert à chaque étape.

## Déploiement (pas encore connecté)

CI GitHub Actions (`.github/workflows/ci.yml`) : lint + typecheck + test sur push/PR. Le déploiement (Railway/Render pour l'API, Vercel/Netlify pour le web, EAS pour le mobile) nécessite des comptes/secrets que je n'ai pas — à brancher avec l'utilisateur quand ces services seront prêts. Ne pas inventer de credentials ni de config de déploiement non demandée.
