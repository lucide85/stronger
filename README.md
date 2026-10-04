# Stronger

Treningsapp (PWA) for styrketrening, løping og kroppsmål, med en AI-agent som justerer
sett/reps/vekt mellom økter basert på fornuftig progresjon og din tilbakemelding.

Designkonsept («Telemetry») ligger som et eget Claude-designartefakt — åpne det på nytt
fra claude.ai/code/artifacts (tittel "Stronger - Telemetry Design Concept") for videre
designarbeid i Claude design.

## Stack

- **client/** — React + Vite + TypeScript + Tailwind, PWA via `vite-plugin-pwa`
- **server/** — Node + Express + TypeScript, Prisma ORM mot SQLite
- **Garmin-synk** — `garmin-connect`-biblioteket (samme tilnærming som i run-appen), per bruker
- **AI-progresjon** — Claude API (`@anthropic-ai/sdk`)
- **Push-varsler** — Web Push / VAPID for påminnelser om kroppsmål
- **Drift** — Docker Compose bak Traefik, som run-appen

## Kom i gang (lokal utvikling)

1. Kopier konfig:
   ```bash
   cp config.example.json config.json
   ```
   Fyll inn `anthropicApiKey`. La `push`-nøklene stå tomme til du har generert VAPID-nøkler (se under) — uten dem fungerer appen fint, bare uten push-varsler.

2. Installer avhengigheter:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

3. Sett opp databasen:
   ```bash
   cd server
   cp .env.example .env
   npm run prisma:migrate
   ```
   Dette oppretter den første migrasjonen og en lokal SQLite-fil.

4. (Valgfritt) Generer VAPID-nøkler for push-varsler, og legg dem inn i `config.json`:
   ```bash
   npx web-push generate-vapid-keys
   ```

5. Start begge deler i hver sin terminal:
   ```bash
   cd server && npm run dev
   cd client && npm run dev
   ```
   Klienten kjører på `http://localhost:5173` og proxyer `/api` til serveren på port 3001.

6. Opprett en bruker via registreringsskjermen, koble til Garmin under Innstillinger
   (valgfritt), og legg inn et styrkeprogram under Styrke for å komme i gang.

## Datamodell (kort)

- `WorkoutProgram` → `ProgramDay` → `ProgramExercise` (planlagte sett/reps/vekt per øvelse)
- `WorkoutSession` → `SessionExercise` → `SetLog` (faktisk utførte sett)
- Etter at alle sett for en øvelse er logget, gir du tilbakemelding
  (`could_do_more` / `on_target` / `could_not_complete`) → serveren spør Claude om et
  `ProgressionSuggestion` for neste gang → du godtar eller avviser forslaget. Et godtatt
  forslag skriver nye mål rett inn i `ProgramExercise`, slik at neste økt på samme dag
  starter med oppdaterte tall.
- `RunningWorkout` og `BodyMeasurement` har et `source`-felt (`manual` / `garmin`) —
  Garmin-synkede rader fylles av `server/src/services/garminSync.ts`, kjørt manuelt fra
  Innstillinger eller automatisk hver morgen via cron-jobben i `server/src/services/cron.ts`.

## Viktige TODOer før dette er "ferdig"

- **PWA-ikoner**: `client/public/icons/icon-192.png` og `icon-512.png` er bare midlertidige
  1×1-piksel-plassholdere. Bytt dem ut med ekte ikoner i riktig størrelse.
- **`garmin-connect`-biblioteket**: feltnavnene i `garminSync.ts` (aktivitetstype,
  vektdata-endepunkt) er skrevet etter beste evne ut fra hvordan pakken typisk eksponerer
  Garmin Connect sitt uoffisielle API. Sjekk dem mot den faktiske pakken når den er
  installert (`node_modules/garmin-connect`), og juster om nødvendig — akkurat som i
  run-appen kan Garmins API endre seg mellom versjoner.
- **Prisma-migrasjon**: kjør `npm run prisma:migrate` i `server/` for å generere den
  første migrasjonsfilen (ligger ikke committet ennå).
- **Docker/Traefik**: bytt ut `stronger.DITT-DOMENE.no` i `docker-compose.yml` med riktig
  (sub)domene, og pass på at `config.json` ligger ved siden av `docker-compose.yml` på
  serveren (den mountes read-only inn i `server`-containeren).

## Designkonsept

Se Claude-designartefaktet ("Stronger - Telemetry Design Concept") for tre skjermer
(dashboard, øktlogging, kroppssjekk) i stilen appen bygger videre på: mørkt
instrumentpanel-uttrykk, HUD-hjørnebrackets på kort, JetBrains Mono for alle tall,
Space Grotesk for overskrifter, og fargekoding per domene (styrke = rav, løping = cyan,
kropp = lime).
