# syntax=docker/dockerfile:1

############################################
# Byggesteg – installerer og bygger begge deler
############################################
FROM node:24-bookworm-slim AS builder
WORKDIR /app

# Prisma trenger openssl tilstede ved generering
RUN apt-get update -y \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY server/package.json server/package-lock.json server/
RUN npm --prefix server ci

COPY client/package.json client/package-lock.json client/
RUN npm --prefix client ci

COPY . .

RUN cd server && npx prisma generate && npm run build
RUN cd client && npm run build

############################################
# Kjøresteg – slankere image som kjører appen
############################################
FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/package.json ./server/package.json
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/config.example.json ./config.example.json

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

# Databasen ligger her og persisteres via et Docker-volum
VOLUME ["/app/server/prisma/data"]

EXPOSE 3002
ENTRYPOINT ["./docker-entrypoint.sh"]
