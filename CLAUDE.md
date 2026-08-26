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
| Stockage images | Cloudinary |
| Cartographie | Leaflet (web, gratuit/sans clé) + react-native-maps (mobile — Apple Maps sur iOS sans clé, Google Maps sur Android avec clé) |
| Testing | Jest (+ Supertest côté backend) |
| Auth | JWT (`jsonwebtoken`) |
| Langage | TypeScript strict partout |
| Hébergement API | Railway / Render |
| Frontend web hosting | Vercel / Netlify |
| Mobile build | EAS Build (Expo) |
| CI/CD | GitHub Actions |
| Monitoring | Sentry |

**État actuel du repo** : monorepo pnpm + Turborepo avec `packages/domain` (coeur métier DDD — agrégats `Trip`, `User`, `Photo`), `packages/backend` (Express/Prisma, JWT, upload Cloudinary, doc OpenAPI sur `/api-docs`), `packages/web` (Vite + React + Tailwind v4 + shadcn/ui + TanStack Query + Leaflet) et `packages/mobile` (Expo + React Native + TanStack Query + react-native-maps + `@react-native-community/datetimepicker` + `expo-media-library`). Fonctionnalités livrées bout-en-bout (domaine → API → web → mobile) : comptes utilisateurs (inscription/connexion/déconnexion/modification/suppression), voyages (création/consultation/modification/suppression/gestion des participants), et carnet photo avec géolocalisation optionnelle (ajout depuis l'appareil photo, la bibliothèque, ou — mobile uniquement — un fichier arbitraire via le sélecteur système ; position GPS capturée en direct, extraite automatiquement des métadonnées EXIF du fichier (web et mobile), ou saisie manuelle, toujours modifiable avant envoi ; l'upload sans aucune position est autorisé ; liste/suppression de photos, affichées sur une carte interactive avec tracé chronologique reliant les positions connues). Saisie des dates : web garde des champs natifs `<input type="date">`/`datetime-local` en texte libre ; mobile utilise un vrai sélecteur de date natif (`@react-native-community/datetimepicker`) pour les dates de début/fin de voyage et la date de prise de vue d'une photo (date+heure sur mobile via deux écrans successifs date puis heure, ce composant ne supportant pas un mode `datetime` unique sur Android) — remplace l'ancienne saisie en texte libre validée manuellement. Web et mobile n'importent pas encore `@voyagin/domain` directement, ils consomment l'API HTTP via des hooks TanStack Query. **Limitation connue navigateur** : sur web, quand l'EXIF d'une photo fraîchement capturée (option "Prendre une photo" du sélecteur de fichier natif) ne contient ni GPS ni date, un repli silencieux (position live du navigateur + date actuelle) prend le relais — fonctionne sur Safari/Chrome iOS, mais pas sur Brave (bloque `navigator.geolocation` par défaut via ses Shields, comportement de confidentialité du navigateur, pas un bug VoyagIn ; pas de contournement fiable côté code, Brave se présente volontairement comme Chrome dans son user-agent pour éviter la détection).

## Décisions architecturales (non négociables)

- **Monorepo** pnpm workspaces + Turborepo, TypeScript strict (`tsconfig.base.json` à la racine, étendu par chaque package).
- **Architecture hexagonale (Ports & Adapters)** : le domaine métier (`packages/domain`) ne dépend d'aucune infra (pas d'Express, pas de Prisma, pas de framework HTTP). Les ports (interfaces, ex. `TripRepository`) sont définis dans le domaine ; les adapters (Prisma, HTTP Express, futurs adapters mobile/web) vivent dans les packages d'infrastructure et implémentent ces ports.
- **DDD** : agrégats, value objects et erreurs de domaine typées vivent dans `packages/domain/src/<contexte>/`. Un agrégat expose `create()` (validé, invariants) et éventuellement `reconstitute()` (rehydratation depuis la persistance, sans re-validation) — voir `Trip.ts` comme référence.
- **Clean code** (Robert C. Martin) : nommage expressif, fonctions courtes, responsabilité unique, pas de commentaires qui expliquent le "quoi" (le code doit se lire comme de la prose).
- **TDD strict — Red → Green → Refactor** : toujours écrire le test avant le code de production. Ne jamais écrire de code d'implémentation sans un test en échec qui le justifie. **100% de couverture sur `packages/domain`** (`coverageThreshold` configuré dans `jest.config.ts`, échoue le build sinon).
- **Hors-ligne d'abord** avec PowerSync (à intégrer lors du scaffold mobile/web).
- **Harmonisation web/mobile** : toute fonctionnalité, tout écran ou toute évolution UX ajoutée sur une plateforme doit être évaluée pour l'autre — contenu, libellés, structure du parcours (ex. écran de connexion/inscription unique avec bascule locale plutôt que deux pages séparées), pas nécessairement le composant visuel lui-même (qui reste idiomatique à chaque plateforme : shadcn/Tailwind sur web, `StyleSheet` natif sur mobile). En cas de divergence constatée entre les deux, ne pas la laisser filer — la corriger dans la foulée en portant la version la plus aboutie (ou préférée par l'utilisateur) sur l'autre plateforme, sauf contrainte technique propre à une plateforme qui justifie l'écart (documenter la raison si c'est le cas). Toute tâche front (nouvel écran, nouveau champ, nouveau texte) doit se demander explicitement "est-ce que l'autre plateforme a/fait la même chose ?" avant d'être considérée terminée.
- **Français partout** : tout texte visible par l'utilisateur (web et mobile) doit être en français correct — jamais de valeur brute non traduite (ex. afficher le rôle `owner`/`member` tel quel au lieu de "organisateur"/"membre"), jamais d'anglicisme évitable. Vérifier systématiquement ce point sur tout nouvel écran, champ ou message d'erreur.
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
- **Backend + Postgres** : Railway, projet `voyagin` (services `Postgres`, `backend`, `db-console`). Service `backend` connecté au repo GitHub (`railway service source connect`) — **auto-déploie sur chaque push sur `main`**. Config de build/start dans `railway.json` à la racine (monorepo pnpm : installe tout le workspace, `prisma generate` au build, `prisma migrate deploy` + `ts-node-dev` au start). Variables `JWT_SECRET`, `DATABASE_URL` (référence `${{Postgres.DATABASE_URL}}`) et `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` (stockage photos) posées sur le service `backend` via `railway variables`. Domaine public généré via `railway domain`.
- **Console DB** : service `db-console` (image Docker officielle `adminer`), domaine public généré, `ADMINER_DEFAULT_SERVER`/`_DRIVER`/`_DB` pré-remplissent le formulaire de connexion mais PAS le mot de passe — celui-ci reste à saisir à chaque connexion (`railway variables --service Postgres` pour le récupérer). Ne jamais mettre ce mot de passe dans un fichier du repo.
- **Web** : Vercel, projet `wagblin1/web`, connecté au repo GitHub (`vercel git connect` + `root-directory=packages/web`) — **auto-déploie sur chaque push sur `main`**. Variable d'env `VITE_API_URL` pointe vers le domaine Railway du backend.
- **Mobile** : pas de déploiement cloud (pas d'EAS/compte Expo — toujours supprimé, non nécessaire), mais des **builds natifs locaux réels** installés directement sur les appareils de l'utilisateur via Xcode/Android Studio (installés le 2026-08-21), en plus du mode Expo Go (`pnpm dev:lan`, toujours valable pour de l'itération rapide en Debug).
  - `packages/mobile/app.json` : `ios.bundleIdentifier`/`android.package` = `com.wagblin.voyagin`. Les dossiers natifs `ios/`/`android/` sont générés à la demande via `npx expo prebuild` (gitignorés — pattern "Continuous Native Generation", jamais commités, à régénérer après tout changement de plugin/config natif).
  - **iOS** : `cd packages/mobile && npx expo run:ios --device "<nom>" --configuration Release` (JS embarqué dans le bundle, pas besoin de Metro ensuite — pointe vers `EXPO_PUBLIC_API_URL` de `.env.production`, donc vers le vrai backend Railway/données de prod ; `--configuration Debug`, le défaut, a besoin de Metro/LAN comme Expo Go). Nécessite CocoaPods (`brew install cocoapods`, Homebrew installé le jour même). Signé avec un **Apple ID gratuit** (Personal Team) — contrairement à ce qui était supposé avant, **aucun compte Apple Developer payant n'est nécessaire** pour tester sur un iPhone/iPad personnel ; limite connue : l'app doit être réinstallée tous les 7 jours (durée de vie du certificat gratuit). Par appareil, une seule fois : activer le Mode développeur (Réglages → Confidentialité et sécurité, apparaît seulement après une première tentative d'install Xcode, redémarrage requis), enregistrer l'appareil dans le profil de provisioning (ouvrir `ios/VoyagIn.xcworkspace` dans Xcode, sélectionner l'appareil dans la liste), et faire confiance au certificat développeur après install (Réglages → Général → VPN et gestion de l'appareil).
  - **Android** : depuis l'arrivée du Pixel 10a physique de l'utilisateur (2026-08-25), le build/déploiement se fait sur ce vrai appareil, plus sur l'émulateur `Pixel_10a` (gardé disponible mais plus utilisé en pratique) : `cd packages/mobile && npx expo run:android --device Pixel_10a --variant release` (nécessite le débogage USB activé sur l'appareil — Réglages → Système → Options pour les développeurs, à révéler via 7 taps sur le numéro de build dans Réglages → À propos du téléphone). `--device` attend le **nom de modèle** tel qu'affiché par `adb devices -l` (colonne `model:`), pas le numéro de série. `--variant release` embarque le JS comme en iOS Release (lit `.env.production`, pointe vers le vrai backend Railway). Nécessite le NDK — **piège connu** : l'auto-installation du NDK par Gradle peut rester bloquée indéfiniment (attend une confirmation interactive jamais reçue en headless) ; si ça bloque, installer manuellement : télécharger `commandlinetools-mac-*` de Google, `sdkmanager --licenses` puis `sdkmanager "ndk;<version>"`. Carte Google Maps : nécessite une clé API Google Cloud (`android.config.googleMaps.apiKey` dans `app.json`, projet Google Cloud avec "Maps SDK for Android" activé) restreinte par package + empreinte SHA-1 — **piège** : le keystore de debug réellement utilisé par le build est `packages/mobile/android/app/debug.keystore` (généré par le template Expo, commun à tous les projets Expo/RN par défaut), **pas** `~/.android/debug.keystore` — récupérer la bonne empreinte via `keytool -list -v -keystore packages/mobile/android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android`.
  - `packages/mobile/src/lib/exifFileLocation.ts` (import de fichier + EXIF) utilise `piexifjs`, pas `exifr` (contrairement au web, qui garde `exifr`) : `exifr` contient un `import()` dynamique sur variable qui fait planter la compilation Hermes en configuration Release (invisible en Debug/Jest) — `piexifjs` n'a aucune dépendance d'environnement (pas de `navigator`/`atob`), sûr pour un build de production mobile.

Non fait / à décider avec l'utilisateur si besoin : domaine custom, passage de Railway en plan payant (le crédit d'essai gratuit expire), mode hors-ligne (SQLite + PowerSync — plan déjà écrit, voir mémoire de session, mis en pause avant implémentation le temps de valider que le Postgres Railway supporte durablement `wal_level=logical`), vue "photo en pleine résolution" au clic (thumbnails Cloudinary ajoutées le 2026-08-21 pour la performance, l'URL pleine résolution reste disponible dans `photo.imageUrl`).
