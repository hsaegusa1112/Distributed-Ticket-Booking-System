import crypto from 'node:crypto';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 8080;
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8081';
const bookingServiceUrl = process.env.BOOKING_SERVICE_URL || 'http://localhost:8083';
const jwtSecret = process.env.JWT_SECRET;
const webOrigin = process.env.WEB_ORIGIN || 'http://localhost:3000';
const allowedOrigins = new Set([webOrigin, 'http://127.0.0.1:3000']);

if (!jwtSecret) {
  throw new Error('JWT_SECRET must be set');
}

app.use((req, res, next) => {
  if (allowedOrigins.has(req.headers.origin)) {
    res.set('Access-Control-Allow-Origin', req.headers.origin);
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
});

app.use(express.json());

async function proxyAuthRequest(req, res, path) {
  try {
    const response = await fetch(`${authServiceUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const body = await response.text();
    res.status(response.status);
    res.set('Content-Type', response.headers.get('content-type') || 'application/json');
    return res.send(body);
  } catch {
    return res.status(503).json({ error: 'authentication service unavailable' });
  }
}

app.post('/api/auth/register', (req, res) => proxyAuthRequest(req, res, '/register'));
app.post('/api/auth/login', (req, res) => proxyAuthRequest(req, res, '/login'));

app.get('/api/events', async (req, res) => {
  try {
    const response = await fetch(`${bookingServiceUrl}/events`);
    const body = await response.text();
    res.status(response.status);
    res.set('Content-Type', response.headers.get('content-type') || 'application/json');
    return res.send(body);
  } catch {
    return res.status(503).json({ error: 'booking service unavailable' });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) {
    return res.status(401).json({ error: 'missing bearer token' });
  }

  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) {
    return res.status(401).json({ error: 'invalid token' });
  }

  const expectedSignature = crypto.createHmac('sha256', jwtSecret).update(`${header}.${payload}`).digest('base64url');
  const providedSignature = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);
  if (providedSignature.length !== expectedSignatureBuffer.length || !crypto.timingSafeEqual(providedSignature, expectedSignatureBuffer)) {
    return res.status(401).json({ error: 'invalid token signature' });
  }

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (claims.exp * 1000 <= Date.now() || !claims.sub || !claims.username) {
      return res.status(401).json({ error: 'expired or invalid token' });
    }
    req.user = { id: claims.sub, username: claims.username };
    return next();
  } catch {
    return res.status(401).json({ error: 'invalid token payload' });
  }
}

app.get('/api/me', authenticateToken, (req, res) => {
  res.status(200).json({ user: req.user });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
