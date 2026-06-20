const axios = require('axios');

const RAPIDAPI_HOST = 'instagram-scraper-api2.p.rapidapi.com';
const RAPIDAPI_BASE = `https://${RAPIDAPI_HOST}`;

const rapidapi = axios.create({
  baseURL: RAPIDAPI_BASE,
  headers: {
    'x-rapidapi-host': RAPIDAPI_HOST,
    'x-rapidapi-key': process.env.RAPIDAPI_KEY,
  },
  timeout: 10000,
});

const parseFollowerRange = (range) => {
  if (!range) return null;
  const parts = range.split('-').map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]))
    return { min: parts[0], max: parts[1] };
  return null;
};

const formatProfile = (data) => ({
  name: data.full_name || data.username || '',
  username: data.username || '',
  bio: data.biography || '',
  city: data.city_name || data.location || '',
  followers: data.follower_count || data.edge_followed_by?.count || 0,
  following: data.following_count || data.edge_follow?.count || 0,
  posts: data.media_count || data.edge_owner_to_timeline_media?.count || 0,
  engagementRate: data.engagement_rate ? parseFloat(data.engagement_rate).toFixed(2) : '0.00',
  accountType: data.is_business ? 'Business' : data.is_professional_account ? 'Creator' : 'Personal',
  profilePic: data.profile_pic_url_hd || data.profile_pic_url || '',
  profileUrl: `https://www.instagram.com/${data.username}/`,
  lastPost: null,
});

// Fetch single profile by username
const fetchByUsername = async (username) => {
  const res = await rapidapi.get('/v1/info', {
    params: { username_or_id_or_url: username },
  });
  const data = res.data?.data || res.data;
  return formatProfile(data);
};

// Search profiles by hashtag (profession + city)
const searchByHashtag = async (keyword) => {
  const res = await rapidapi.get('/v1/hashtag', {
    params: { hashtag: keyword },
  });
  const posts = res.data?.data?.top?.sections || res.data?.data?.recent?.sections || [];
  const usernames = [];
  posts.forEach(section => {
    section?.layout_content?.medias?.forEach(media => {
      const user = media?.media?.user;
      if (user?.username) usernames.push(user.username);
    });
  });
  return [...new Set(usernames)].slice(0, 10);
};

const searchProfiles = async ({ city, profession, followers, username }) => {
  try {
    // Direct username lookup
    if (username) {
      const handle = username.replace('@', '');
      const profile = await fetchByUsername(handle);
      return [profile];
    }

    // Search by hashtag
    const keyword = `${profession}${city}`.toLowerCase().replace(/\s+/g, '');
    const usernames = await searchByHashtag(keyword);

    if (!usernames.length) {
      // Fallback: try profession only
      const fallbackUsernames = await searchByHashtag(profession.toLowerCase().replace(/\s+/g, ''));
      usernames.push(...fallbackUsernames);
    }

    if (!usernames.length) return [];

    // Fetch each profile
    const profiles = await Promise.all(
      usernames.map(async (uname) => {
        try {
          return await fetchByUsername(uname);
        } catch {
          return null;
        }
      })
    );

    let filtered = profiles.filter(Boolean);

    // Apply follower range filter
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
