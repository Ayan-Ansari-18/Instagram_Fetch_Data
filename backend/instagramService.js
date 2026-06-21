const axios = require('axios');

const HOST = 'instagram-scraper-stable-api.p.rapidapi.com';
const BASE = `https://${HOST}`;
const TIMEOUT = 25000;

const headers = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'x-rapidapi-host': HOST,
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
};

const parseFollowerRange = (range) => {
  if (!range) return null;
  const parts = range.split('-').map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]))
    return { min: parts[0], max: parts[1] };
  return null;
};

const parseFollowerCount = (str) => {
  if (!str) return 0;
  if (typeof str === 'number') return str;
  const s = str.replace(/,/g, '').toLowerCase();
  if (s.includes('m')) return Math.round(parseFloat(s) * 1000000);
  if (s.includes('k')) return Math.round(parseFloat(s) * 1000);
  return parseInt(s) || 0;
};

const searchUsers = async (query) => {
  const res = await axios.post(`${BASE}/search_ig.php`,
    new URLSearchParams({ search_query: query }),
    { headers, timeout: TIMEOUT }
  );
  const users = res.data?.users || [];
  return users.map(item => ({
    username: item.user?.username || '',
    name: item.user?.full_name || '',
    profilePic: item.user?.hd_profile_pic_url_info?.url || item.user?.profile_pic_url || '',
    isVerified: item.user?.is_verified || false,
    followersRaw: item.user?.search_social_context || '',
  })).filter(u => u.username);
};

const searchProfiles = async ({ city, profession, followers, username }) => {
  try {
    let users = [];

    if (username) {
      users = await searchUsers(username.replace('@', ''));
    } else {
      const queries = [
        `${profession} ${city}`,
        profession,
        city,
      ];
      for (const q of queries) {
        users = await searchUsers(q);
        if (users.length) break;
      }
    }

    if (!users.length) return [];

    const range = parseFollowerRange(followers);

    const profiles = users.slice(0, 10).map(u => {
      const followerCount = parseFollowerCount(u.followersRaw);
      return {
        name: u.name || u.username,
        username: u.username,
        bio: '',
        city: city || '',
        followers: followerCount,
        following: 0,
        posts: 0,
        engagementRate: '0.00',
        accountType: u.isVerified ? 'Creator' : 'Personal',
        profilePic: u.profilePic,
        profileUrl: `https://www.instagram.com/${u.username}/`,
        lastPost: null,
      };
    });

    if (range) {
      return profiles.filter(p => p.followers >= range.min && p.followers <= range.max);
    }

    return profiles;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message);
  }
};

module.exports = { searchProfiles };
