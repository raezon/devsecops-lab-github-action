const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const config = require("./config");
const usersRouter = require("../api/users");

const app = express();

// =============================================================================
// 1. MIDDLEWARES DE SÉCURITÉ ET CONFIGURATION
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

app.use(morgan(":method :url :status :res[content-length] - :response-time ms"));
app.use(express.json({ limit: "1mb" }));

// HELMET : Appliqué ici, il sécurise TOUTES les routes, incluant les fichiers statiques du dossier 'public'
app.use(helmet());

// =============================================================================
// 2. FICHIERS STATIQUES (robots.txt, sitemap.xml)
// =============================================================================
// Placé avant les routes pour que ZAP les trouve en priorité
app.use(express.static('public'));

// =============================================================================
// 3. ROUTES STANDARD & HEALTHCHECK
// =============================================================================
app.get("/", (req, res) => {
  res.json({ message: "Bienvenue sur l'API TechFlow SAS", documentation: "/api/docs" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", env: config.app.env });
});

app.use("/api/users", usersRouter);

// =============================================================================
// 4. ROUTES DE TESTS (Vulnérabilités intentionnelles pour ZAP)
// =============================================================================

// Injection SQL
app.get("/api/vulnerable/search", (req, res) => {
  const userId = req.query.id;
  const query = "SELECT * FROM users WHERE id = " + userId; 
  res.send(`Requête exécutée : ${query}`);
});

// Reflected XSS
app.get("/api/vulnerable/hello", (req, res) => {
  const name = req.query.name || "Inconnu";
  res.send("<h1>Bonjour " + name + "</h1>");
});

// Fuite d'information
app.get("/api/vulnerable/debug", (req, res) => {
  throw new Error("Erreur critique : échec de connexion à la base de données root@localhost:5432");
});

// Path Traversal (Attention : usage pédagogique uniquement)
app.get("/api/vulnerable/download", (req, res) => {
  const file = req.query.file;
  res.sendFile(__dirname + "/../public/" + file); 
});

// Route qui liste les endpoints pour aider ZAP à mapper l'API
app.get("/api/endpoints", (req, res) => {
  res.json({
    routes: [
      { path: "/api/users", method: "GET" },
      { path: "/api/vulnerable/search", method: "GET", params: ["id"] },
      { path: "/api/vulnerable/hello", method: "GET", params: ["name"] },
      { path: "/api/vulnerable/download", method: "GET", params: ["file"] },
      { path: "/api/vulnerable/debug", method: "GET" }
    ]
  });
});
// =============================================================================
// 5. GESTIONNAIRE D'ERREURS GLOBAL (Doit être en dernier)
// =============================================================================
app.use((err, req, res, next) => {
  console.error(err.stack);
  const response = { error: "Une erreur interne est survenue" };
  
  if (config.app.env === "development") {
    response.message = err.message;
    response.stack = err.stack;
  }
  res.status(500).json(response);
});

// =============================================================================
// 6. DÉMARRAGE
// =============================================================================
app.listen(config.app.port, () => {
  console.log(`TechFlow API démarrée sur le port ${config.app.port} en mode ${config.app.env}`);
});

module.exports = app;