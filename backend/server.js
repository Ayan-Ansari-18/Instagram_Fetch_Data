require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { searchProfiles } = require('./instagramService');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('CORS not allowed'));
  },
}));
app.use(express.json());

// In-memory cache — 5 min TTL
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

const getCached = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
};

const setCache = (key, data) => cache.set(key, { data, ts: Date.now() });

// Input sanitization
const sanitize = (str) => str ? String(str).trim().replace(/[<>"'%;()&+]/g, '').slice(0, 100) : '';

// Retry helper — 3 retries on rate limit (429)
const withRetry = async (fn, retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit = err.message?.includes('rate') || err.response?.status === 429;
      if (isRateLimit && i < retries - 1) {
        await new Promise(res => setTimeout(res, delay * (i + 1)));
      } else {
        throw err;
      }
    }
  }
};

// Request timeout middleware — 8 seconds
const withTimeout = (ms) => (req, res, next) => {
  res.setTimeout(ms, () => {
    res.status(503).json({ error: 'Request timeout, please retry' });
  });
  next();
};

app.get('/api/search', withTimeout(8000), async (req, res) => {
  const city = sanitize(req.query.city);
  const profession = sanitize(req.query.profession);
  const followers = sanitize(req.query.followers);
  const username = sanitize(req.query.username);

  if (!city && !username) return res.status(400).json({ error: 'City is required' });
  if (!profession && !username) return res.status(400).json({ error: 'Profession is required' });

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!accessToken) return res.status(500).json({ error: 'Instagram access token not configured' });

  const cacheKey = `${city}:${profession}:${followers}:${username}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json({ results: cached, fromCache: true });

  try {
    const results = await withRetry(() =>
      searchProfiles({ city, profession, followers, username }, accessToken)
    );
    setCache(cacheKey, results);
    res.json({ results });
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: err.message || 'Data fetch mein problem hui, please retry' });
  }
});

app.get('/health', (_, res) => res.json({ status: 'ok', cacheSize: cache.size }));

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '..', 'build');
  app.use(express.static(buildPath));
  app.get('*', (_, res) => res.sendFile(path.join(buildPath, 'index.html')));
}

if (require.main === module) {
  app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
}

module.exports = app;
