const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const config = require("./config");
const usersRouter = require("../api/users");

const app = express();

// =============================================================================
// SECURE : Définition d'une allowlist d'origines au lieu du joker *
// =============================================================================
const allowedOrigins = ['https://app.techflow.io', 'http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// SECURE : Format de log personnalisé pour ne JAMAIS enregistrer les headers Authorization
app.use(morgan(":method :url :status :res[content-length] - :response-time ms"));

// SECURE : Limite de payload raisonnable pour éviter les attaques DoS (1mb max au lieu de 50mb)
app.use(express.json({ limit: "1mb" }));

// =============================================================================
// SECURE : Activation des en-têtes de sécurité de base avec Helmet
// =============================================================================
const helmet = require('helmet');
app.use(helmet());

// =============================================================================
// Routes requises pour OWASP ZAP & Docker
// =============================================================================

// ✅ ROUTE INDEX : Indispensable pour l'audit initial de ZAP (évite la 404 au démarrage du scan)
app.get("/", (req, res) => {
  res.json({
    message: "Bienvenue sur l'API TechFlow SAS",
    documentation: "/api/docs" // Optionnel, indique à ZAP où chercher les routes
  });
});

// ✅ ENDPOINT HEALTHCHECK NETTOYÉ : Valide pour ZAP et Docker, sécurisé pour la prod
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    env: config.app.env // On affiche uniquement l'environnement global (staging/production)
  });
});

// Routes applicatives
app.use("/api/users", usersRouter);

// =============================================================================
// Gestionnaire d'erreurs global sécurisé
// =============================================================================
app.use((err, req, res, next) => {
  console.error(err.stack); // On garde les logs détaillés côté serveur uniquement
  
  const response = { error: "Une erreur interne est survenue" };
  
  // On n'affiche le message d'erreur d'origine QU'EN mode développement, jamais en staging/prod
  if (config.app.env === "development") {
    response.message = err.message;
    response.stack = err.stack;
  }

  res.status(500).json(response);
});

// Démarrage de l'application
app.listen(config.app.port, () => {
  console.log(`TechFlow API démarrée sur le port ${config.app.port}`);
  console.log(`Mode : ${config.app.env}`);
  // SECURE : Plus aucune fuite de secrets ou de mots de passe de base de données dans les fichiers de logs au démarrage
});

module.exports = app;