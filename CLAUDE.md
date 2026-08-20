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

**État actuel du repo** : monorepo pnpm + Turborepo avec `packages/domain` (coeur métier DDD — agrégats `Trip` et `User`), `packages/backend` (Express/Prisma, JWT, doc OpenAPI sur `/api-docs`), `packages/web` (Vite + React + Tailwind v4 + shadcn/ui + TanStack Query) et `packages/mobile` (Expo + React Native + TanStack Query). Fonctionnalités livrées bout-en-bout (domaine → API → web → mobile) : comptes utilisateurs (inscription/connexion/déconnexion/modification/suppression) et voyages (création/consultation/modification/suppression/gestion des participants). Web et mobile n'importent pas encore `@voyagin/domain` directement, ils consomment l'API HTTP via des hooks TanStack Query.

## Décisions architecturales (non négociables)

- **Monorepo** pnpm workspaces + Turborepo, TypeScript strict (`tsconfig.base.json` à la racine, étendu par chaque package).
- **Architecture hexagonale (Ports & Adapters)** : le domaine métier (`packages/domain`) ne dépend d'aucune infra (pas d'Express, pas de Prisma, pas de framework HTTP). Les ports (interfaces, ex. `TripRepository`) sont définis dans le domaine ; les adapters (Prisma, HTTP Express, futurs adapters mobile/web) vivent dans les packages d'infrastructure et implémentent ces ports.
- **DDD** : agrégats, value objects et erreurs de domaine typées vivent dans `packages/domain/src/<contexte>/`. Un agrégat expose `create()` (validé, invariants) et éventuellement `reconstitute()` (rehydratation depuis la persistance, sans re-validation) — voir `Trip.ts` comme référence.
- **Clean code** (Robert C. Martin) : nommage expressif, fonctions courtes, responsabilité unique, pas de commentaires qui expliquent le "quoi" (le code doit se lire comme de la prose).
- **TDD strict — Red → Green → Refactor** : toujours écrire le test avant le code de production. Ne jamais écrire de code d'implémentation sans un test en échec qui le justifie. **100% de couverture sur `packages/domain`** (`coverageThreshold` configuré dans `jest.config.ts`, échoue le build sinon).
- **Hors-ligne d'abord** avec PowerSync (à intégrer lors du scaffold mobile/web).
- Pas de raccourcis "temporaires", pas d'abstraction anticipée sur des besoins hypothétiques.
- **Documentation tenue à jour** : `README.md` (racine) et la section "État actuel du repo" ci-dessus doivent refléter les fonctionnalités réellement livrées. Toute tâche qui ajoute un endpoint, un package, une commande ou change la façon de lancer le projet n'est terminée que lorsque `README.md` et ce fichier sont mis à jour en conséquence — ne pas attendre qu'on le demande explicitement.

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

`localhost` dans `packages/web/.env` (`VITE_API_URL`) ou `packages/mobile/.env` (`EXPO_PUBLIC_API_URL`) désigne l'appareil qui exécute le navigateur/l'app — pas la machine de dev, et l'IP change à chaque changement de réseau Wi-Fi.

**`./scripts/dev-up.sh`** (ou `pnpm dev:lan`) automatise tout ça : détecte l'IP Wi-Fi actuelle (`ipconfig getifaddr en0`, fallback `en1`), compare à la valeur déjà présente dans `packages/web/.env`, réécrit `VITE_API_URL`/`EXPO_PUBLIC_API_URL` si elle a changé, tue tout ce qui écoute déjà sur les ports 3000/5173/8081/5555, puis relance Postgres (docker compose), le backend (`HOST=0.0.0.0` par défaut dans `server.ts`), Vite (`--host 0.0.0.0`), Expo et Prisma Studio en arrière-plan (logs dans `.dev/logs/`). Si l'IP a changé, il vide aussi le cache Metro (`expo start -c`) pour forcer le rechargement du bundle sur le téléphone. À relancer à chaque fois que le Wi-Fi change — c'est idempotent.

Point d'attention non automatisable : Expo Go (App Store) ne supporte que la dernière version de SDK Expo publiée — si l'app affiche "Project is incompatible with this version of Expo Go", c'est que le SDK du projet (`packages/mobile/package.json`, dépendance `expo`) est plus récent que ce que Expo Go supporte : rétrograder (`npx expo install expo@^<version>` puis `npx expo install --fix`) plutôt que d'attendre une mise à jour de l'app — voir `packages/mobile/AGENTS.md` pour la version actuellement pinnée et pourquoi.

## Workflow à 2 agents Claude Code

Deux subagents dans `.claude/agents/` reproduisent le mode de travail décrit par l'utilisateur :

- **`architecte`** : à invoquer pour démarrer une nouvelle fonctionnalité ou un nouveau slice de domaine. Explore le contexte existant, définit les ports/interfaces et les invariants, écrit les tests en échec (Red) — **n'écrit jamais de code de production**.
- **`developpeur`** : à invoquer une fois que des tests en échec existent. Implémente le minimum de code pour les faire passer (Green), puis refactore en gardant la suite verte. Respecte les frontières hexagonales posées par l'architecte.

Usage typique : `architecte` d'abord sur une feature, puis `developpeur` pour l'implémentation, en gardant `pnpm turbo run test` vert à chaque étape.

## Déploiement

CI GitHub Actions (`.github/workflows/ci.yml`) : lint + typecheck + test sur push/PR.

Déploiement cloud en place (comptes de l'utilisateur, connectés via CLI le 2026-08-20) :
- **Backend + Postgres** : Railway, projet `voyagin` (services `Postgres`, `backend`, `db-console`). Service `backend` connecté au repo GitHub (`railway service source connect`) — **auto-déploie sur chaque push sur `main`**. Config de build/start dans `railway.json` à la racine (monorepo pnpm : installe tout le workspace, `prisma generate` au build, `prisma migrate deploy` + `ts-node-dev` au start). Variables `JWT_SECRET` et `DATABASE_URL` (référence `${{Postgres.DATABASE_URL}}`) posées sur le service `backend` via `railway variables`. Domaine public généré via `railway domain`.
- **Console DB** : service `db-console` (image Docker officielle `adminer`), domaine public généré, `ADMINER_DEFAULT_SERVER`/`_DRIVER`/`_DB` pré-remplissent le formulaire de connexion mais PAS le mot de passe — celui-ci reste à saisir à chaque connexion (`railway variables --service Postgres` pour le récupérer). Ne jamais mettre ce mot de passe dans un fichier du repo.
- **Web** : Vercel, projet `wagblin1/web`, connecté au repo GitHub (`vercel git connect` + `root-directory=packages/web`) — **auto-déploie sur chaque push sur `main`**. Variable d'env `VITE_API_URL` pointe vers le domaine Railway du backend.
- **Mobile** : pas de déploiement cloud — **Expo Go ne peut pas charger les mises à jour publiées via EAS Update** (limitation d'Expo : dès qu'un projet a `runtimeVersion`/`updates.url` configurés, Expo Go refuse de l'ouvrir, il faut une "development build" avec `expo-dev-client`). Testé via `pnpm dev:lan` (voir section Wi-Fi ci-dessus) : Metro tourne sur la machine de dev, ouvert dans Expo Go via `exp://<IP>:8081`. Un projet EAS existe (`@wagblin/voyagin`, `eas init`) mais n'est pas utilisé pour l'instant — pourrait servir à une vraie development build (EAS Build) si besoin d'un accès mobile permanent : gratuit pour Android (.apk à sideloader), nécessite un compte Apple Developer à 99$/an pour un vrai appareil iOS.

Non fait / à décider avec l'utilisateur si besoin : domaine custom, passage de Railway en plan payant (le crédit d'essai gratuit expire), development build mobile (coût Apple à trancher pour iOS).
