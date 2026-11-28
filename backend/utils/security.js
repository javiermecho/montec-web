import crypto from 'crypto';

// Secreto JWT: usa variable de entorno obligatoria en producción;
// si falta en desarrollo, genera un secreto efímero por proceso (nunca un valor fijo predecible).
const EPHEMERAL_FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

function getJwtSecret() {
  const envSecret = (process.env.JWT_SECRET || '').trim();
  if (envSecret.length >= 16) return envSecret;
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ [Seguridad] JWT_SECRET no configurado en Railway. Se usa secreto efímero (las sesiones expirarán al reiniciar).');
  }
  return EPHEMERAL_FALLBACK_SECRET;
}

function getEncryptionKey() {
  const raw = (process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || EPHEMERAL_FALLBACK_SECRET).trim();
  return crypto.createHash('sha256').update(raw).digest();
}

// ============================================================================
// 1. HASHING DE CONTRASEÑAS CON SCRYPT (NODE CRYPTO NATIVO)
// ============================================================================

export function hashPassword(password) {
  const clean = String(password || '');
  if (!clean) throw new Error('La contraseña no puede estar vacía');
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(clean, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password, storedHash) {
  const clean = String(password || '');
  if (!clean || !storedHash || typeof storedHash !== 'string') return false;

  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;

  const [, salt, originalHex] = parts;
  try {
    const derived = crypto.scryptSync(clean, salt, 64);
    const original = Buffer.from(originalHex, 'hex');
    if (derived.length !== original.length) return false;
    return crypto.timingSafeEqual(derived, original);
  } catch {
    return false;
  }
}

// ============================================================================
// 2. JWT HS256 (FIRMA Y VERIFICACIÓN EN TIEMPO CONSTANTE)
// ============================================================================

function base64UrlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let b64 = String(str).replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) b64 += '=';
  return Buffer.from(b64, 'base64').toString('utf8');
}

export function signToken(payload, expiresInSeconds = 60 * 60 * 12) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedBody = base64UrlEncode(JSON.stringify(body));
  const signingInput = `${encodedHeader}.${encodedBody}`;

  const signature = crypto
    .createHmac('sha256', getJwtSecret())
    .update(signingInput)
    .digest();

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedBody, encodedSig] = parts;
  const signingInput = `${encodedHeader}.${encodedBody}`;

  try {
    const expectedSig = base64UrlEncode(
      crypto.createHmac('sha256', getJwtSecret()).update(signingInput).digest()
    );

    const bufA = Buffer.from(encodedSig, 'utf8');
    const bufB = Buffer.from(expectedSig, 'utf8');
    if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedBody));
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// ============================================================================
// 3. CIFRADO AES-256-GCM PARA SECRETOS EN BASE DE DATOS
// ============================================================================

export function encryptSecret(plainText) {
  const text = String(plainText || '');
  if (!text) return '';
  if (text.startsWith('enc:v1:')) return text; // Ya cifrado

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `enc:v1:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSecret(storedText) {
  const text = String(storedText || '');
  if (!text) return '';
  if (!text.startsWith('enc:v1:')) return text; // Compatibilidad con datos previos sin cifrar

  const parts = text.split(':');
  if (parts.length !== 5) return '';

  try {
    const [, , ivHex, tagHex, dataHex] = parts;
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      getEncryptionKey(),
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final()
    ]);
    return decrypted.toString('utf8');
  } catch {
    return '';
  }
}

// ============================================================================
// 4. MIDDLEWARES DE AUTENTICACIÓN Y AUTORIZACIÓN EXPRESS
// ============================================================================

export function extractBearerToken(req) {
  const authHeader = req.headers?.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

export function optionalAuth(req, _res, next) {
  const token = extractBearerToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  const token = extractBearerToken(req);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      error: 'Sesión no válida o expirada. Iniciá sesión nuevamente.'
    });
  }
  req.user = payload;
  next();
}

export function requireAdmin(req, res, next) {
  const token = extractBearerToken(req);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      error: 'Sesión no válida o expirada. Iniciá sesión como Administrador.'
    });
  }
  if (payload.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado. Se requieren permisos de Administrador.'
    });
  }
  req.user = payload;
  next();
}

// ============================================================================
// 5. RATE LIMITING EN MEMORIA PARA LOGIN
// ============================================================================

const loginAttempts = new Map();
const MAX_ATTEMPTS = 12;
const WINDOW_MS = 15 * 60 * 1000;

export function checkLoginRateLimit(ip) {
  const key = String(ip || 'unknown');
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    return { allowed: true };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((WINDOW_MS - (now - entry.firstAttempt)) / 1000);
    return { allowed: false, retryAfterSec };
  }

  return { allowed: true };
}

export function recordFailedLogin(ip) {
  const key = String(ip || 'unknown');
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
  } else {
    entry.count += 1;
    loginAttempts.set(key, entry);
  }
}

export function clearLoginRateLimit(ip) {
  loginAttempts.delete(String(ip || 'unknown'));
}
