// =============================================================================
// ⚠️  VULNÉRABILITÉ #4 — CLÉ JWT HARDCODÉE + ALGORITHME FAIBLE
// =============================================================================
// Problème : Clé secrète JWT en dur, algorithme HS256 avec clé faible.
// Impact   : Falsification de tokens → accès non autorisé à tous les comptes.
// Fix      : Utiliser RS256 (asymétrique), clé de 256+ bits, stockée dans Vault.
// Outil    : Semgrep (règle jwt-hardcoded-secret), Snyk Code.
// =============================================================================

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

// =============================================================================
// ✅ VERSION CORRIGÉE (commentée)
// =============================================================================
/*
const fs = require('fs');

// Clés RSA chargées depuis le système de fichiers (montées par Vault Agent)
const PRIVATE_KEY = fs.readFileSync('/run/secrets/jwt_private_key');
const PUBLIC_KEY  = fs.readFileSync('/run/secrets/jwt_public_key');

function generateAccessToken(payload) {
  // Validation stricte du payload
  if (!payload.userId || !payload.role) throw new Error('Payload JWT invalide');

  return jwt.sign(
    { sub: payload.userId, role: payload.role, iss: 'techflow-api', aud: 'techflow-client' },
    PRIVATE_KEY,
    { algorithm: 'RS256', expiresIn: '15m' }  // ← access token court
  );
}

function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Non authentifié' });

  try {
    const decoded = jwt.verify(token, PUBLIC_KEY, {
      algorithms: ['RS256'],
      issuer: 'techflow-api',
      audience: 'techflow-client'
    });
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Session expirée ou invalide' });
  }
}
*/
