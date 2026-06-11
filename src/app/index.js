const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const config = require("./config");
const usersRouter = require("../api/users");

const app = express();

// =============================================================================
// ⚠️  VULN : CORS ouvert à tous les origines (CORS wildcard)
// Fix : Définir une allowlist d'origines : ['https://app.techflow.io']
// =============================================================================
app.use(cors({ origin: "*" }));

// ⚠️ VULN : morgan combined logue les Authorization headers (tokens JWT)
// Fix : Logger uniquement les méthodes, URLs, status codes
app.use(morgan("combined"));

app.use(express.json({ limit: "50mb" }));  // ⚠️ VULN : limite trop haute (DoS)

// =============================================================================
// ⚠️  VULN : Headers de sécurité absents (pas de Helmet)
// Fix : app.use(helmet()) — ajoute CSP, HSTS, X-Frame-Options, etc.
// =============================================================================
// app.use(require('helmet')()); // ← ligne commentée intentionnellement

// =============================================================================
// Routes
// =============================================================================
app.use("/api/users", usersRouter);

// ⚠️ VULN : endpoint de healthcheck exposant des infos système
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    version: config.app.version,
    env: config.app.env,
    uptime: process.uptime(),
    memory: process.memoryUsage(),   // ← expose des métriques système
    node_version: process.version,   // ← expose la version Node.js
    pid: process.pid,                // ← expose le PID du process
  });
});

// ⚠️ VULN : pas de rate limiting sur aucun endpoint
// Fix : app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 100 }))

// ⚠️ VULN : gestionnaire d'erreur global expose le stack trace
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: err.message,
    stack: err.stack,         // ← NE JAMAIS exposer le stack en prod
    config: config.database,  // ← BUG : config copiée par accident
  });
});

app.listen(config.app.port, () => {
  console.log(`TechFlow API démarrée sur le port ${config.app.port}`);
  console.log(`Mode : ${config.app.env}`);
  // ⚠️ VULN : log des secrets au démarrage
  console.log(`DB : ${config.database.user}:${config.database.password}@${config.database.host}`);
  console.log(`AWS Key : ${config.aws.accessKeyId}`);
});

module.exports = app;
