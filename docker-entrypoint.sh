#!/bin/sh
set -e

# Sørg for at databasemappa finnes (mountes som volum)
DATA_DIR=/app/server/prisma/data
mkdir -p "$DATA_DIR"

DB="$DATA_DIR/stronger.db"

# Automatisk sikkerhetskopi FØR skjemaendringer. Serveren har ikke startet
# ennå, så databasen er i ro og kopien er garantert konsistent.
if [ -f "$DB" ]; then
  ts=$(date +%Y%m%d-%H%M%S)
  echo "→ Tar sikkerhetskopi av databasen: backup-$ts.db"
  cp "$DB" "$DATA_DIR/backup-$ts.db"
  [ -f "$DB-wal" ] && cp "$DB-wal" "$DATA_DIR/backup-$ts.db-wal" || true
  [ -f "$DB-journal" ] && cp "$DB-journal" "$DATA_DIR/backup-$ts.db-journal" || true
  # Behold de 7 nyeste kopiene
  ls -1t "$DATA_DIR"/backup-*.db 2>/dev/null | tail -n +8 | while read -r f; do
    rm -f "$f" "$f-wal" "$f-journal"
  done
fi

# Kjør ventende migreringer. Feiler høyt hvis noe ville vært destruktivt –
# data slettes aldri stille. (Subshell: cd-et påvirker ikke resten av scriptet,
# så node under starter fortsatt med /app som working directory.)
echo "→ Kjører databasemigreringer (prisma migrate deploy)…"
(cd server && npx prisma migrate deploy)

echo "→ Starter Stronger…"
exec node server/dist/index.js
