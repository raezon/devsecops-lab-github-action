# =============================================================================
# ⚠️  VULNÉRABILITÉ #2 — IMAGE DE BASE NON ÉPINGLÉE + MAUVAISES PRATIQUES
# =============================================================================
# Problèmes :
#   1. ubuntu:latest → version indéterminée, reproductibilité impossible
#   2. Installation de packages sans vérification de signature
#   3. Application lancée en root (uid=0)
#   4. Pas de multi-stage build → image finale contient les outils de build
#   5. COPY . . copie .env, node_modules, secrets locaux
#   6. Pas de .dockerignore configuré correctement
#   7. Package-lock.json ignoré → versions non épinglées
# =============================================================================

# ⚠️ VULN : image non épinglée (latest = version inconnue à chaque build)
FROM ubuntu:latest

# ⚠️ VULN : pas de vérification des signatures apt
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    curl \
    wget \
    git \
    vim \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ⚠️ VULN : COPY . . copie tout, y compris .env, .git, secrets locaux
COPY . .

# ⚠️ VULN : npm install au lieu de npm ci (versions non reproductibles)
RUN npm install

# ⚠️ VULN : port en dur, pas configurable
EXPOSE 3000

# ⚠️ VULN : l'application tourne en root (pas d'USER non-root)
# ⚠️ VULN : NODE_ENV non défini → développement par défaut
CMD ["node", "src/app/index.js"]


# =============================================================================
# ✅ VERSION CORRIGÉE (commentée — Dockerfile sécurisé multi-stage)
# =============================================================================
#
# # --- Stage 1 : Build ---
# FROM node:20.11.0-alpine3.19 AS builder
# # ↑ image épinglée avec digest SHA256 recommandé en prod
#
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci --only=production  # ← npm ci = versions exactes du lock file
#
# # --- Stage 2 : Runtime minimal ---
# FROM node:20.11.0-alpine3.19 AS runtime
#
# # ✅ Utilisateur non-root dédié
# RUN addgroup -S techflow && adduser -S techflow -G techflow
# WORKDIR /app
#
# # ✅ Copier seulement le nécessaire depuis le stage build
# COPY --from=builder --chown=techflow:techflow /app/node_modules ./node_modules
# COPY --chown=techflow:techflow src/ ./src/
#
# # ✅ Utilisateur non-root
# USER techflow
#
# # ✅ Healthcheck intégré
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
#   CMD curl -f http://localhost:3000/health || exit 1
#
# ENV NODE_ENV=production
# EXPOSE 3000
# CMD ["node", "src/app/index.js"]
