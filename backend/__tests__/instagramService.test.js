const { searchProfiles } = require('../instagramService');
const axios = require('axios');

jest.mock('axios');

const mockProfile = (id, followers) => ({
  id,
  name: `User ${id}`,
  username: `user${id}`,
  biography: 'Fitness coach',
  followers_count: followers,
  follows_count: 300,
  media_count: 50,
  profile_picture_url: '',
  account_type: 'PERSONAL',
});

beforeEach(() => jest.clearAllMocks());

describe('Follower range filter', () => {
  it('filters profiles within follower range', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('ig_hashtag_search')) return Promise.resolve({ data: { data: [{ id: 'tag1' }] } });
      if (url.includes('top_media')) return Promise.resolve({ data: { data: [
        { id: 'm1', owner: { id: 'u1' }, like_count: 100, comments_count: 10 },
        { id: 'm2', owner: { id: 'u2' }, like_count: 50, comments_count: 5 },
      ]}});
      if (url.includes('/u1')) return Promise.resolve({ data: mockProfile('u1', 8000) });
      if (url.includes('/u2')) return Promise.resolve({ data: mockProfile('u2', 200) });
      return Promise.resolve({ data: {} });
    });

    const results = await searchProfiles({ city: 'Mumbai', profession: 'Fitness', followers: '5000-50000', username: '' }, 'token');
    expect(results.length).toBe(1);
    expect(results[0].followers).toBe(8000);
  });

  it('returns all profiles when no follower range given', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('ig_hashtag_search')) return Promise.resolve({ data: { data: [{ id: 'tag1' }] } });
      if (url.includes('top_media')) return Promise.resolve({ data: { data: [{ id: 'm1', owner: { id: 'u1' }, like_count: 10, comments_count: 1 }] }});
      if (url.includes('/u1')) return Promise.resolve({ data: mockProfile('u1', 500) });
      return Promise.resolve({ data: {} });
    });

    const results = await searchProfiles({ city: 'Delhi', profession: 'Chef', followers: '', username: '' }, 'token');
    expect(results.length).toBe(1);
  });
});

describe('Engagement rate', () => {
  it('calculates correctly — (likes+comments)/followers*100', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('ig_hashtag_search')) return Promise.resolve({ data: { data: [{ id: 'tag1' }] } });
      if (url.includes('top_media')) return Promise.resolve({ data: { data: [{ id: 'm1', owner: { id: 'u1' }, like_count: 900, comments_count: 100 }] }});
      if (url.includes('/u1')) return Promise.resolve({ data: mockProfile('u1', 10000) });
      return Promise.resolve({ data: {} });
    });

    const results = await searchProfiles({ city: 'Pune', profession: 'Yoga', followers: '', username: '' }, 'token');
    expect(results[0].engagementRate).toBe(10);
  });

  it('returns 0 when followers is 0', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('ig_hashtag_search')) return Promise.resolve({ data: { data: [{ id: 'tag1' }] } });
      if (url.includes('top_media')) return Promise.resolve({ data: { data: [{ id: 'm1', owner: { id: 'u1' }, like_count: 100, comments_count: 10 }] }});
      if (url.includes('/u1')) return Promise.resolve({ data: mockProfile('u1', 0) });
      return Promise.resolve({ data: {} });
    });

    const results = await searchProfiles({ city: 'Pune', profession: 'Yoga', followers: '', username: '' }, 'token');
    expect(results[0].engagementRate).toBe(0);
  });
});

describe('Username direct lookup', () => {
  it('fetches single profile by username', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProfile('u1', 15000) });
    const results = await searchProfiles({ city: 'Mumbai', profession: 'Trainer', followers: '', username: '@useru1' }, 'token');
    expect(results.length).toBe(1);
    expect(results[0].profileUrl).toBe('https://instagram.com/useru1');
  });
});

describe('Error handling', () => {
  it('returns empty array when no hashtag found', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('ig_hashtag_search')) return Promise.resolve({ data: { data: [] } });
      return Promise.resolve({ data: {} });
    });
    const results = await searchProfiles({ city: 'X', profession: 'Y', followers: '', username: '' }, 'token');
    expect(results).toEqual([]);
  });

  it('throws readable error on API failure', async () => {
    axios.get.mockRejectedValueOnce({ response: { data: { error: { message: 'Invalid token' } } } });
    await expect(searchProfiles({ city: 'A', profession: 'B', followers: '', username: '' }, 'bad'))
      .rejects.toThrow('Invalid token');
  });
});

describe('Profile output shape', () => {
  it('returns all 12 required fields', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('ig_hashtag_search')) return Promise.resolve({ data: { data: [{ id: 'tag1' }] } });
      if (url.includes('top_media')) return Promise.resolve({ data: { data: [{ id: 'm1', owner: { id: 'u1' }, like_count: 10, comments_count: 2 }] }});
      if (url.includes('/u1')) return Promise.resolve({ data: mockProfile('u1', 5000) });
      return Promise.resolve({ data: {} });
    });

    const results = await searchProfiles({ city: 'Mumbai', profession: 'Fitness', followers: '', username: '' }, 'token');
    ['name','username','bio','city','followers','following','posts','engagementRate','accountType','profilePic','profileUrl','lastPost']
      .forEach(k => expect(results[0]).toHaveProperty(k));
  });
});
