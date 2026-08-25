# VoyagIn

[![CI](https://github.com/wagblin/voyagin/actions/workflows/ci.yml/badge.svg)](https://github.com/wagblin/voyagin/actions/workflows/ci.yml)

Carnet de voyage collaboratif en temps réel. **« Le In compte »** : VoyagIn capture le voyage **pendant** qu'il se déroule, pas seulement en le planifiant à l'avance.

- **Avant** : un groupe (couple, amis) définit ses envies, ses contraintes (dates, budget, envie d'improviser) et les grands axes de l'itinéraire.
- **Pendant** : carnet de voyage en direct — capture photo/lieu/heure en temps réel, ajustement du planning à la volée, collaboration multi-utilisateur synchronisée entre appareils.
- **Après** : archive permanente — carte interactive avec chronologie photo, histoire partageable.

## Stack

| Domaine | Choix |
|---|---|
| Mobile | React Native + Expo |
| Web | React + Vite |
| UI | shadcn/ui + Tailwind CSS |
| State (client) | TanStack Query |
| Backend | Node.js + Express |
| ORM | Prisma |
| Base de données | PostgreSQL |
| Validation | Zod |
| Auth | JWT |
| Stockage images | Cloudinary |
| Cartographie | Leaflet (web) + react-native-maps (mobile) |
| Tests | Jest / Vitest (+ Supertest côté backend) |
| Langage | TypeScript strict partout |
| Doc API | OpenAPI / Swagger |
| CI | GitHub Actions |

Architecture **hexagonale** (ports & adapters) + **DDD** + **TDD strict** (Red → Green → Refactor, 100% de couverture sur le domaine métier). Détails complets des décisions d'architecture dans [`CLAUDE.md`](./CLAUDE.md).

## Structure du monorepo

```
packages/
  domain/     # coeur métier pur (DDD) — agrégats Trip, User, Photo, ports, use cases — 0 dépendance infra
  backend/    # API Express — adapters HTTP, persistence Prisma, sécurité (JWT, bcrypt), Swagger
  web/        # React + Vite + Tailwind + shadcn/ui + TanStack Query
  mobile/     # Expo + React Native + TanStack Query
```

## Démarrer en local

Prérequis : Node.js ≥ 20, pnpm, Docker (pour Postgres).

```bash
pnpm install

# Base de données locale
docker compose up -d postgres
cd packages/backend
cp .env.example .env
npx prisma migrate dev

# Lancer les 3 apps (dans des terminaux séparés)
pnpm --filter @voyagin/backend dev     # http://localhost:3000 — doc API sur /api-docs
pnpm --filter @voyagin/web dev         # http://localhost:5173
pnpm --filter @voyagin/mobile start    # Expo — scanner le QR avec Expo Go
```

### Tester depuis un iPhone/iPad sur le même Wi-Fi

```bash
pnpm dev:lan    # ou : ./scripts/dev-up.sh
```

Détecte l'IP Wi-Fi de la machine, met à jour `packages/web/.env` et `packages/mobile/.env`, puis (re)lance Postgres, le backend, le web, Expo et Prisma Studio en écoute sur toutes les interfaces. Relance-le à chaque changement de réseau Wi-Fi — il détecte si l'IP a changé et vide le cache Expo automatiquement si besoin. Logs dans `.dev/logs/`. Détails dans [`CLAUDE.md`](./CLAUDE.md#tester-depuis-un-téléphonetablette-physique-sur-le-même-wi-fi).

## Vérifier le projet

```bash
pnpm turbo run typecheck lint test    # pipeline complet (utilisé par la CI)
pnpm turbo run test:coverage          # 100% de couverture requis sur packages/domain
```

## API

Une fois le backend lancé, la documentation interactive (OpenAPI/Swagger) est disponible sur `http://localhost:3000/api-docs` — toutes les routes y sont testables directement (bouton *Authorize* pour coller un token JWT).

Fonctionnalités actuelles :
- **Comptes utilisateurs** : inscription, connexion, déconnexion, modification du profil, suppression du compte.
- **Voyages** : création, consultation, modification, suppression, gestion des participants (ajout/retrait) — réservée à l'organisateur du voyage.
- **Carnet photo avec géolocalisation optionnelle** : ajout d'une photo (avec horodatage) à un voyage — réservé aux participants ; liste et suppression (auteur de la photo ou organisateur du voyage) ; affichage sur une carte interactive (web et mobile) avec tracé chronologique reliant les positions connues, dans l'ordre de prise de vue. La photo peut venir de l'appareil photo (position GPS capturée en direct), de la bibliothèque (web et mobile), ou — sur mobile uniquement — d'un fichier importé depuis le sélecteur système (Fichiers/iCloud Drive/Drive). Pour la bibliothèque et l'import de fichier, la position est extraite automatiquement des métadonnées EXIF si présentes ; sinon elle peut être saisie manuellement, ou laissée vide — la géolocalisation n'est jamais obligatoire pour ajouter une photo. Latitude/longitude toujours modifiables avant l'envoi.

## Déploiement

L'API et le web tournent en permanence dans le cloud (pas besoin d'une machine allumée pour tester) :

| | URL |
|---|---|
| API + Swagger | https://backend-production-693c2.up.railway.app/api-docs |
| Web | https://web-mauve-alpha-16.vercel.app |
| Console DB | https://db-console-production.up.railway.app (Adminer — identifiants Postgres requis, voir Railway) |

Hébergement : Railway (API + Postgres + console DB), Vercel (web). Les deux se redéploient automatiquement à chaque push sur `main`.

**Mobile** : pas de déploiement cloud (pas d'EAS) — mais des builds natifs locaux réels installables sur iPhone/iPad et sur un vrai Android (Pixel 10a) via Xcode/Android Studio (`npx expo run:ios --device "<nom>" --configuration Release` / `npx expo run:android --device Pixel_10a --variant release`), en plus du mode Expo Go pour l'itération rapide (`pnpm dev:lan`). Voir `CLAUDE.md` (section Déploiement) pour la procédure détaillée et les pièges connus (signature Apple, clé Google Maps, NDK Android).

**Console DB (Adminer)** : exposée publiquement mais protégée par les identifiants Postgres eux-mêmes (Adminer n'a pas de session sans les fournir à chaque connexion — même niveau de protection qu'un accès `psql` direct). Les identifiants sont dans Railway (`railway variables --service Postgres`), jamais commités.

## Workflow de développement

Deux subagents Claude Code dans [`.claude/agents/`](./.claude/agents/) reproduisent un mode de travail à deux rôles :
- **`architecte`** : conçoit une nouvelle fonctionnalité et écrit les tests en échec (Red) — jamais de code de production.
- **`developpeur`** : implémente le minimum de code pour faire passer les tests (Green), puis refactore.

## Licence

Projet personnel, non publié sous licence pour l'instant.
