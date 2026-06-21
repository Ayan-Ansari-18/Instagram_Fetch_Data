const axios = require('axios');

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'instagram-looter2.p.rapidapi.com';
const TIMEOUT = 60000;

const parseFollowerRange = (range) => {
  if (!range) return null;
  const parts = range.split('-').map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]))
    return { min: parts[0], max: parts[1] };
  return null;
};

// Step 1: Search usernames via Instagram Looter
const searchUsernames = async (query) => {
  const res = await axios.get(`https://${RAPIDAPI_HOST}/search`, {
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-host': RAPIDAPI_HOST,
      'x-rapidapi-key': RAPIDAPI_KEY,
    },
    params: { query },
    timeout: 25000,
  });
  const users = res.data?.users || [];
  return users.map(item => {
    const u = item.user || item;
    return u.username;
  }).filter(Boolean).slice(0, 10);
};

// Step 2: Fetch full profiles via Apify
const fetchProfilesViaApify = async (usernames) => {
  // Start actor run
  const runRes = await axios.post(
    `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs?token=${APIFY_TOKEN}`,
    { usernames },
    { timeout: TIMEOUT }
  );

  const runId = runRes.data?.data?.id;
  if (!runId) throw new Error('Apify run failed to start');

  // Wait for completion (poll every 3 seconds, max 50 seconds)
  for (let i = 0; i < 17; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const statusRes = await axios.get(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`,
      { timeout: 10000 }
    );
    const status = statusRes.data?.data?.status;
    if (status === 'SUCCEEDED') break;
    if (status === 'FAILED' || status === 'ABORTED') throw new Error('Apify run failed');
  }

  // Get results
  const datasetId = runRes.data?.data?.defaultDatasetId;
  const resultsRes = await axios.get(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`,
    { timeout: 10000 }
  );

  return resultsRes.data || [];
};

const searchProfiles = async ({ city, profession, followers, username }) => {
  try {
    let usernames = [];

    if (username) {
      usernames = [username.replace('@', '')];
    } else {
      const queries = [`${profession} ${city}`, profession, city];
      for (const q of queries) {
        usernames = await searchUsernames(q);
        if (usernames.length) break;
      }
    }

    if (!usernames.length) return [];

    // Fetch real profile data via Apify
    const apifyProfiles = await fetchProfilesViaApify(usernames.slice(0, 5));

    const profiles = apifyProfiles.map(u => ({
      name: u.fullName || u.username || '',
      username: u.username || '',
      bio: u.biography || '',
      city: u.city || u.addressCity || city || '',
      followers: u.followersCount || 0,
      following: u.followsCount || 0,
      posts: u.postsCount || 0,
      engagementRate: '0.00',
      accountType: u.isBusinessAccount ? 'Business' : u.verified ? 'Creator' : 'Personal',
      profilePic: u.profilePicUrl || '',
      profileUrl: `https://www.instagram.com/${u.username}/`,
      lastPost: null,
    }));

    const range = parseFollowerRange(followers);
    if (range) {
      return profiles.filter(p => p.followers >= range.min && p.followers <= range.max);
    }

    return profiles;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message);
  }
};

module.exports = { searchProfiles };
