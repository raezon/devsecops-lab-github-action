
const express = require("express");
const { Pool } = require("pg");
const config = require("../app/config");
const { verifyToken } = require("../auth/jwt");

const router = express.Router();

// ⚠️ VULN : pool DB initialisé avec les credentials en clair de config.js
const pool = new Pool({
  host:     config.database.host,
  port:     config.database.port,
  database: config.database.name,
  user:     config.database.user,
  password: config.database.password,  // ← vient de config.js (secret en clair)
  ssl:      config.database.ssl,
});

// =============================================================================
// GET /api/users/search?name=xxx
// ⚠️ VULN : INJECTION SQL — concaténation directe du paramètre utilisateur
// =============================================================================
router.get("/search", verifyToken, async (req, res) => {
  const { name } = req.query;

  // ⚠️ VULN : injection SQL via concaténation
  // Payload malveillant : name='; DROP TABLE users; --
  // Payload d'extraction : name=' OR '1'='1
  const query = `SELECT id, name, email, role FROM users WHERE name LIKE '%${name}%'`;

  try {
    const result = await pool.query(query);  // ← requête non paramétrée
    res.json(result.rows);
  } catch (err) {
    // ⚠️ VULN : exposition du message d'erreur SQL (divulgue la structure DB)
    res.status(500).json({ error: err.message, query: query });
  }
});

// =============================================================================
// GET /api/users/:id
// ⚠️ VULN : IDOR (Insecure Direct Object Reference) — pas de vérif d'ownership
// =============================================================================
router.get("/:id", verifyToken, async (req, res) => {
  const userId = req.params.id;

  // ⚠️ VULN : n'importe quel utilisateur authentifié peut voir le profil de n'importe qui
  // ⚠️ VULN : injection SQL possible sur l'ID si pas de validation de type
  const query = `SELECT * FROM users WHERE id = ${userId}`;  // ← pas de $1

  try {
    const result = await pool.query(query);
    if (result.rows.length === 0) return res.status(404).json({ error: "Utilisateur non trouvé" });

    // ⚠️ VULN : retourne password_hash et données sensibles !
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post("/", async (req, res) => {
  // ⚠️ VULN : spread direct du body → un attaquant peut envoyer { role: "admin" }
  const { name, email, password, ...rest } = req.body;

  const hashedPassword = password; // ⚠️ VULN : pas de hashage (MD5 utilisé ailleurs)

  // ⚠️ VULN : injection SQL + mass assignment
  const query = `
    INSERT INTO users (name, email, password, role, ${Object.keys(rest).join(", ")})
    VALUES ('${name}', '${email}', '${hashedPassword}', 'user', ${Object.values(rest).map(v => `'${v}'`).join(", ")})
    RETURNING id, name, email, role
  `;

  try {
    const result = await pool.query(query);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// GET /api/users/admin/export
// ⚠️ VULN : endpoint non protégé exposant toute la table users
// =============================================================================
router.get("/admin/export", async (req, res) => {
  // ⚠️ VULN : aucune vérification d'authentification ni de rôle admin
  // ⚠️ VULN : retourne TOUS les utilisateurs avec password_hash
  const result = await pool.query("SELECT * FROM users");
  res.json({
    count: result.rows.length,
    users: result.rows,  // ← inclut password_hash, tokens de reset, etc.
    exported_at: new Date().toISOString(),
  });
});

// =============================================================================
// ⚠️  ENDPOINT DE DEBUG — NE JAMAIS LAISSER EN PROD
// =============================================================================
router.get("/debug/config", (req, res) => {
  // ⚠️ VULN : expose la configuration complète incluant les secrets
  res.json({
    database: config.database,  // ← mot de passe DB exposé
    aws: config.aws,            // ← clés AWS exposées
    jwt: config.jwt,            // ← secret JWT exposé
  });
});

module.exports = router;

