const axios = require('axios');

const HOST = 'instagram-looter2.p.rapidapi.com';
const BASE = `https://${HOST}`;
const TIMEOUT = 25000;

const headers = {
  'Content-Type': 'application/json',
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
  const res = await axios.get(`${BASE}/search`, {
    headers,
    params: { query },
    timeout: TIMEOUT,
  });
  const users = res.data?.users || [];
  return users.map(item => {
    const u = item.user || item;
    return {
      username: u.username || '',
      name: u.full_name || u.username || '',
      profilePic: u.profile_pic_url || '',
      isVerified: u.is_verified || false,
      pk: u.pk || u.id || '',
    };
  }).filter(u => u.username);
};

const getUserInfo = async (username) => {
  const res = await axios.get(`${BASE}/profile`, {
    headers,
    params: { username },
    timeout: TIMEOUT,
  });
  const u = res.data?.data || res.data;
  return {
    followers: u?.follower_count || u?.edge_followed_by?.count || 0,
    following: u?.following_count || u?.edge_follow?.count || 0,
    posts: u?.media_count || u?.edge_owner_to_timeline_media?.count || 0,
    bio: u?.biography || '',
    accountType: u?.is_business ? 'Business' : u?.is_professional_account ? 'Creator' : 'Personal',
  };
};

const searchProfiles = async ({ city, profession, followers, username }) => {
  try {
    let users = [];

    if (username) {
      users = await searchUsers(username.replace('@', ''));
    } else {
      const queries = [`${profession} ${city}`, profession, city];
      for (const q of queries) {
        users = await searchUsers(q);
        if (users.length) break;
      }
    }

    if (!users.length) return [];

    // Fetch detailed info for top 5 only
    const top5 = users.slice(0, 5);
    const profiles = await Promise.all(
      top5.map(async (u) => {
        try {
          const info = await getUserInfo(u.username);
          return {
            name: u.name,
            username: u.username,
            bio: info.bio,
            city: city || '',
            followers: info.followers,
            following: info.following,
            posts: info.posts,
            engagementRate: '0.00',
            accountType: info.accountType,
            profilePic: u.profilePic,
            profileUrl: `https://www.instagram.com/${u.username}/`,
            lastPost: null,
          };
        } catch {
          return {
            name: u.name,
            username: u.username,
            bio: '',
            city: city || '',
            followers: 0,
            following: 0,
            posts: 0,
            engagementRate: '0.00',
            accountType: u.isVerified ? 'Creator' : 'Personal',
            profilePic: u.profilePic,
            profileUrl: `https://www.instagram.com/${u.username}/`,
            lastPost: null,
          };
        }
      })
    );

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
