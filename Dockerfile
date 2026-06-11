# ═════════════════════════════════════════════════════════════════════════════
# STAGE 1 : Build & Installation des dépendances
# ═════════════════════════════════════════════════════════════════════════════
FROM node:20.11.0-alpine3.19 AS builder

WORKDIR /app

# Copie uniquement les fichiers de définition des packages
COPY package*.json ./

# Installation stricte des dépendances de prod (pas de devDependencies, pas de fioritures)
RUN npm ci --omit=dev --ignore-scripts

# ═════════════════════════════════════════════════════════════════════════════
# STAGE 2 : Runtime Minimaliste et Sécurisé
# ═════════════════════════════════════════════════════════════════════════════
FROM node:20.11.0-alpine3.19 AS runtime

# Configuration de l'environnement de production dès le départ
ENV NODE_ENV=production
WORKDIR /app

# Crée un groupe et un utilisateur non-root système sans mot de passe ni home lourd
RUN addgroup -S techflow && adduser -S -G techflow techflow

# Récupération sélective du builder (Léger & Propre)
COPY --from=builder --chown=techflow:techflow /app/node_modules ./node_modules
COPY --chown=techflow:techflow src/ ./src/

# Changement d'utilisateur pour le runtime
USER techflow

# ✅ HEALTHCHECK Ultra-léger : Pas besoin de installer curl ! 
# On utilise un script Node inline natif pour interroger l'endpoint de santé.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

EXPOSE 3000

CMD ["node", "src/app/index.js"]