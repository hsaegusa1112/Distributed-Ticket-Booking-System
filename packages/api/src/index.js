import crypto from 'node:crypto';
import express from 'express';
import pg from 'pg';
import { createClient } from 'redis';

const app = express();
const PORT = process.env.PORT || 8080;
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8081';
const bookingServiceUrl = process.env.BOOKING_SERVICE_URL || 'http://localhost:8083';
const databaseUrl = process.env.DATABASE_URL || 'postgres://ticket_booking:ticket_booking@localhost:5432/ticket_booking';
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const jwtSecret = process.env.JWT_SECRET;
const webOrigin = process.env.WEB_ORIGIN || 'http://localhost:3000';
const allowedOrigins = new Set([webOrigin, 'http://127.0.0.1:3000']);
const database = new pg.Pool({ connectionString: databaseUrl });
const redis = createClient({ url: redisUrl, socket: { reconnectStrategy: false } });
let redisAvailable = false;
const storesCacheKey = 'stores:v1';
const storesCacheTtlSeconds = 300;

redis.on('error', (error) => {
  console.error('Redis unavailable:', error.message);
  redisAvailable = false;
});

redis.connect().then(() => {
  redisAvailable = true;
  console.log('Redis cache is available');
}).catch(() => {
  console.warn('Redis cache is unavailable; using PostgreSQL directly');
});

if (!jwtSecret) {
  throw new Error('JWT_SECRET must be set');
}

app.use((req, res, next) => {
  if (allowedOrigins.has(req.headers.origin)) {
    res.set('Access-Control-Allow-Origin', req.headers.origin);
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Credentials', 'true');
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
    if (path === '/login' && response.ok) {
      const { accessToken } = JSON.parse(body);
      if (!accessToken || typeof accessToken !== 'string') {
        return res.status(502).json({ error: 'authentication service returned an invalid login response' });
      }
      res.cookie('ticket_booking_session', accessToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });
      return res.status(response.status).json({ status: 'authenticated' });
    }
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

app.get('/api/stores', async (req, res) => {
  try {
    if (redisAvailable) {
      const cachedStores = await redis.get(storesCacheKey);
      if (cachedStores) {
        return res.status(200).json(JSON.parse(cachedStores));
      }
    }

    const { rows } = await database.query(`
      SELECT id, name, address, city, phone
      FROM stores
      ORDER BY name
    `);
    if (redisAvailable) {
      await redis.setEx(storesCacheKey, storesCacheTtlSeconds, JSON.stringify(rows));
    }
    return res.status(200).json(rows);
  } catch {
    return res.status(503).json({ error: 'store database unavailable' });
  }
});

app.post('/api/bookings', authenticateToken, async (req, res) => {
  const { showingId, email, quantity = 1 } = req.body;
  if (!showingId || !Number.isInteger(quantity) || quantity < 1 || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'showingId, a valid email, and a positive integer quantity are required' });
  }

  try {
    const response = await fetch(`${bookingServiceUrl}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showingId, customerId: req.user.id, email, quantity }),
    });
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
  const token = req.headers.cookie?.match(/(?:^|;\s*)ticket_booking_session=([^;]+)/)?.[1];
  if (!token) {
    return res.status(401).json({ error: 'missing session cookie' });
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
