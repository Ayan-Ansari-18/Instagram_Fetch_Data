const request = require('supertest');

jest.mock('../instagramService', () => ({
  searchProfiles: jest.fn(),
}));

const { searchProfiles } = require('../instagramService');

// Load server after mock
let app;
beforeAll(() => {
  process.env.INSTAGRAM_ACCESS_TOKEN = 'test_token';
  process.env.IG_USER_ID = '123';
  app = require('../server');
});

afterEach(() => jest.clearAllMocks());

describe('GET /health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /api/search', () => {
  it('returns 400 when city is missing', async () => {
    const res = await request(app).get('/api/search').query({ profession: 'Trainer' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/city/i);
  });

  it('returns 400 when profession is missing', async () => {
    const res = await request(app).get('/api/search').query({ city: 'Mumbai' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/profession/i);
  });

  it('returns results on valid query', async () => {
    searchProfiles.mockResolvedValueOnce([{ name: 'Test User', username: 'testuser', followers: 5000 }]);
    const res = await request(app).get('/api/search').query({ city: 'Mumbai', profession: 'Trainer' });
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].username).toBe('testuser');
  });

  it('retries on rate limit error and eventually returns 500', async () => {
    const rateLimitErr = new Error('rate limit exceeded');
    searchProfiles.mockRejectedValue(rateLimitErr);
    // Use unique city to bypass cache
    const res = await request(app).get('/api/search').query({ city: 'UniqueCity_RateLimit', profession: 'Trainer' });
    expect(res.status).toBe(500);
  }, 20000);

  it('returns results when only username is provided', async () => {
    searchProfiles.mockResolvedValueOnce([{ name: 'Direct User', username: 'directuser', followers: 10000 }]);
    const res = await request(app).get('/api/search').query({ username: '@directuser' });
    expect(res.status).toBe(200);
    expect(res.body.results[0].username).toBe('directuser');
  });
});
