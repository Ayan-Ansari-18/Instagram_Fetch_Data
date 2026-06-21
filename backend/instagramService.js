const axios = require('axios');

const HOST = 'instagram-scraper-stable-api.p.rapidapi.com';
const BASE = `https://${HOST}`;
const headers = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'x-rapidapi-host': HOST,
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
};

const TIMEOUT = 25000;

const parseFollowerRange = (range) => {
  if (!range) return null;
  const parts = range.split('-').map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]))
    return { min: parts[0], max: parts[1] };
  return null;
};

// Search users by keyword
const searchUsers = async (query) => {
  const res = await axios.post(`${BASE}/search_ig.php`,
    new URLSearchParams({ search_query: query }),
    { headers, timeout: TIMEOUT }
  );
  console.log('Search response:', JSON.stringify(res.data).slice(0, 500));
  const items = res.data?.users || res.data?.data?.users || res.data?.result?.users || [];
  return items.map(u => u.username || u.user?.username).filter(Boolean);
};

// Get full profile by username
const getUserProfile = async (username) => {
  const res = await axios.get(`${BASE}/get_ig_user_basic_and_posts.php`,
    { headers: { ...headers, 'Content-Type': 'application/json' }, params: { username_or_url: username }, timeout: TIMEOUT }
  );
  console.log('Profile response:', JSON.stringify(res.data).slice(0, 500));
  return res.data?.data || res.data?.user || res.data;
};

const formatProfile = (data) => ({
  name: data.full_name || data.username || '',
  username: data.username || '',
  bio: data.biography || data.bio || '',
  city: data.city_name || data.location_name || '',
  followers: data.follower_count || data.followers || 0,
  following: data.following_count || data.following || 0,
  posts: data.media_count || data.posts_count || 0,
  engagementRate: data.engagement_rate ? parseFloat(data.engagement_rate).toFixed(2) : '0.00',
  accountType: data.is_business ? 'Business' : data.is_professional_account ? 'Creator' : 'Personal',
  profilePic: data.profile_pic_url_hd || data.profile_pic_url || '',
  profileUrl: `https://www.instagram.com/${data.username}/`,
  lastPost: null,
});

const searchProfiles = async ({ city, profession, followers, username }) => {
  try {
    let usernames = [];

    if (username) {
      usernames = [username.replace('@', '')];
    } else {
      // Try "profession city" first, fallback to profession only
      usernames = await searchUsers(`${profession} ${city}`);
      if (!usernames.length) usernames = await searchUsers(profession);
      if (!usernames.length) return [];
    }

    const profiles = await Promise.all(
      usernames.slice(0, 5).map(async (uname) => {
        try {
          const data = await getUserProfile(uname);
          return formatProfile(data);
        } catch {
          return null;
        }
      })
    );

    let filtered = profiles.filter(Boolean);

    const range = parseFollowerRange(followers);
    if (range) {
      filtered = filtered.filter(p => p.followers >= range.min && p.followers <= range.max);
    }

    return filtered;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message);
  }
};

module.exports = { searchProfiles };
