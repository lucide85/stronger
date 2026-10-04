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
- **Drift** — Én Docker-container (server serverer bygget frontend statisk) bak Traefik
  på en annen VM, akkurat som treningsapp/run

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
## Publisering hjemme med Docker + Traefik

Samme oppsett som treningsapp/run: **appen kjører som Docker-container på app-VM-en**,
og **Traefik kjører på en annen VM** og ruter trafikk fra domenet ditt inn over HTTPS.
I produksjon serverer appen alt (API + frontend) fra **én port**. Siden run-appen
allerede bruker port 3001 på app-VM-en, kjører Stronger som en egen container ved
siden av, på **port 3005**.

```
Internett → ruter (port 80/443) → Traefik-VM → http://<APP_VM_IP>:3005 → stronger-container
   DNS: stronger.vikane.cloud ─────┘             (Traefik håndterer TLS/Let's Encrypt)
```

### Steg 1 – Brannmur på app-VM-en

```bash
sudo ufw allow from <TRAEFIK_VM_IP> to any port 3005 proto tcp
```

### Steg 2 – Hent og start appen (på app-VM-en, ved siden av treningsapp)

```bash
git clone https://github.com/lucide85/stronger.git
cd stronger
cp config.example.json config.json
nano config.json   # fyll inn anthropicApiKey, VAPID-nøkler (se under), sessionSecret

# Generer VAPID-nøkler for push-varsler om du ikke har gjort det lokalt:
npx --yes web-push generate-vapid-keys

docker compose up -d --build
docker compose logs -f        # skal vise «Stronger API listening on :3005»
curl -I http://localhost:3005/api/health
```

Databasen (SQLite) lagres på Docker-volumet `stronger-data` og overlever omstart og
oppdatering. `docker-entrypoint.sh` tar en automatisk sikkerhetskopi før hver
`prisma migrate deploy` (de 7 nyeste beholdes på volumet).

### Steg 3 – Rut domenet til appen (på Traefik-VM-en)

Kopier [`deploy/traefik/stronger.yml`](deploy/traefik/stronger.yml) til Traefiks
dynamiske mappe (samme mappe du allerede brukte for `treningsapp.yml`, typisk
`/etc/traefik/dynamic/`), og juster IP-en i `url:` hvis app-VM-en din ikke er
`192.168.1.25`. Domenet er satt til `stronger.vikane.cloud` — bytt om du vil ha noe annet.

Med `watch: true` i Traefiks file-provider plukkes den opp automatisk, ellers:
`docker restart traefik` (eller `sudo systemctl restart traefik`).

### Steg 4 – Verifiser

1. Opprett en DNS A-record `stronger.vikane.cloud` → din offentlige IP (om ikke gjort).
2. Åpne `https://stronger.vikane.cloud` — gyldig sertifikat og innloggingssiden.
3. Installer som app på mobil (Legg til på Hjem-skjerm / Installer app).

### Oppdatere appen senere

```bash
cd stronger && git pull && docker compose up -d --build   # data beholdes
```

## Viktige TODOer før dette er "ferdig"

- **PWA-ikoner**: `client/public/icons/icon-192.png` og `icon-512.png` er bare midlertidige
  1×1-piksel-plassholdere. Bytt dem ut med ekte ikoner i riktig størrelse.
- **`garmin-connect`-biblioteket**: feltnavnene i `garminSync.ts` er sjekket mot pakkens
  publiserte typer for v1.6.2, men Garmins uoffisielle API kan endre seg — verifiser mot
  faktisk kontodata ved første synk.

## Designkonsept

Se Claude-designartefaktet ("Stronger - Telemetry Design Concept") for tre skjermer
(dashboard, øktlogging, kroppssjekk) i stilen appen bygger videre på: mørkt
instrumentpanel-uttrykk, HUD-hjørnebrackets på kort, JetBrains Mono for alle tall,
Space Grotesk for overskrifter, og fargekoding per domene (styrke = rav, løping = cyan,
kropp = lime).
