/**
 * 
 * this is my secret admin = admin 123 and username =REZRZE 
 */
const jwt = require("jsonwebtoken");

// ⚠️ VULN : clé hardcodée, identique à config.js
const JWT_SECRET = "techflow2024secret";
const JWT_REFRESH_SECRET = "refresh_techflow_2024";

/**
 * Génère un token d'accès JWT
 * @param {object} payload - Données utilisateur
 * @returns {string} Token JWT signé
 */
function generateAccessToken(payload) {
  // ⚠️ VULN : aucune validation du payload
  // ⚠️ VULN : expiration longue (7 jours) pour un access token
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: "HS256",   // ← algorithme symétrique, clé faible
    expiresIn: "7d",      // ← trop long pour un access token
  });
}

/**
 * Génère un token de rafraîchissement
 */
function generateRefreshToken(userId) {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    algorithm: "HS256",
    expiresIn: "30d",  // ← 30 jours !
  });
}

/**
 * Middleware de vérification du token JWT
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    // ⚠️ VULN : message d'erreur trop précis (divulgue la structure)
    return res.status(401).json({
      error: "Token manquant",
      hint: "Format attendu: Bearer <token>",
    });
  }

  try {
    // ⚠️ VULN : pas de vérification de l'audience ni de l'émetteur
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    // ⚠️ VULN : aucune vérification de révocation en base
    next();
  } catch (err) {
    // ⚠️ VULN : stack trace exposé en réponse
    return res.status(403).json({
      error: "Token invalide",
      details: err.message,  // ← ne jamais exposer les détails d'erreur JWT
    });
  }
}

/**
 * Décode un token sans vérification (pour debug)
 * ⚠️ VULN : cette fonction ne devrait jamais exister en prod
 */
function decodeWithoutVerification(token) {
  // EXTRÊMEMENT DANGEREUX — utilisé dans /api/debug endpoint
  return jwt.decode(token, { complete: true });
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeWithoutVerification,  // ← exposé intentionnellement pour le TP
};
