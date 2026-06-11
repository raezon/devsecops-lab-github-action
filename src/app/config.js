
const config = {
  // --- Application ---
  app: {
    name: "TechFlow API",
    version: "2.3.1",
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || "development",
  },

  // --- Base de données ---
  // ⚠️ VULN : credentials DB hardcodés
  database: {
    host: "prod-db.techflow-internal.com",
    port: 5432,
    name: "techflow_prod",
    user: "techflow_admin",
    password: "Sup3rS3cr3tDB!2024",   // ← SECRET EN CLAIR
    ssl: false,                         // ← SSL désactivé en prod !
    pool: { min: 2, max: 10 },
  },

  aws: {
    region: "eu-west-1",
    accessKeyId: "AKIAIOSFODNN7EXAMPLE",          // ← AWS ACCESS KEY
    secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", // ← AWS SECRET
    s3: {
      bucket: "techflow-prod-documents",
      uploadsBucket: "techflow-user-uploads",
    },
    ses: {
      fromEmail: "no-reply@techflow.io",
    },
  },

  // --- Stripe (paiements) ---
  // ⚠️ VULN : clé secrète Stripe en clair
  stripe: {
    publishableKey: "pk_live_51AbCdEfGhIjKlMnOpQrStUv",
    secretKey: "sk_live_51AbCdEfGhIjKlMnOpQrStUvWxYz123456789",  // ← SECRET STRIPE
    webhookSecret: "whsec_aBcDeFgHiJkLmNoPqRsTuVwXyZ",
  },

  // --- JWT ---
  // ⚠️ VULN : clé JWT faible et hardcodée (voir aussi auth/jwt.js)
  jwt: {
    secret: "techflow2024secret",   // ← CLÉ FAIBLE ET HARDCODÉE
    expiresIn: "7d",
    refreshSecret: "refresh_techflow_2024",
  },

  // --- Slack ---
  slack: {
    webhookUrl: "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
    channel: "#alerts-prod",
  },

  // --- Feature flags ---
  features: {
    enableNewDashboard: true,
    enableBetaExport: false,
    maintenanceMode: false,
  },
};

// ❌ MAUVAISE PRATIQUE : export direct sans validation
module.exports = config;

