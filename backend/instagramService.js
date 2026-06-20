const axios = require('axios');

const BASE_URL = 'https://graph.instagram.com';
const FB_BASE_URL = 'https://graph.facebook.com/v19.0';

// Parse follower range string "5000-50000" => { min: 5000, max: 50000 }
const parseFollowerRange = (range) => {
  if (!range) return null;
  const parts = range.split('-').map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { min: parts[0], max: parts[1] };
  }
  return null;
};

// Calculate engagement rate
const calcEngagement = (likes, comments, followers) => {
  if (!followers) return 0;
  return (((likes + comments) / followers) * 100).toFixed(2);
};

// Fetch single profile by username via Graph API
const fetchByUsername = async (username, accessToken) => {
  const res = await axios.get(`${FB_BASE_URL}/${username}`, {
    params: {
      fields: 'name,biography,followers_count,follows_count,media_count,profile_picture_url,account_type,website',
      access_token: accessToken,
    },
  });
  return res.data;
};

// Search profiles by keyword (city + profession) using hashtag/keyword search
const searchProfiles = async ({ city, profession, followers, username }, accessToken) => {
  try {
    // If username provided — direct lookup
    if (username) {
      const handle = username.replace('@', '');
      const profile = await fetchByUsername(handle, accessToken);
      return [formatProfile(profile, city, profession)];
    }

    // Search via hashtag: profession + city combined keyword
    const keyword = `${profession} ${city}`.toLowerCase().replace(/\s+/g, '');
    const hashtagRes = await axios.get(`${FB_BASE_URL}/ig_hashtag_search`, {
      params: {
        user_id: process.env.IG_USER_ID,
        q: keyword,
        access_token: accessToken,
      },
    });

    const hashtagId = hashtagRes.data.data?.[0]?.id;
    if (!hashtagId) return [];

    const mediaRes = await axios.get(`${FB_BASE_URL}/${hashtagId}/top_media`, {
      params: {
        user_id: process.env.IG_USER_ID,
        fields: 'id,owner,like_count,comments_count',
        access_token: accessToken,
      },
    });

    const mediaList = mediaRes.data.data || [];
    const ownerIds = [...new Set(mediaList.map(m => m.owner?.id).filter(Boolean))];

    // Fetch each owner profile
    const profiles = await Promise.all(
      ownerIds.slice(0, 20).map(async (ownerId) => {
        try {
          const pRes = await axios.get(`${FB_BASE_URL}/${ownerId}`, {
            params: {
              fields: 'name,username,biography,followers_count,follows_count,media_count,profile_picture_url,account_type',
              access_token: accessToken,
            },
          });
          const media = mediaList.find(m => m.owner?.id === ownerId);
          return formatProfile(pRes.data, city, profession, media?.like_count, media?.comments_count);
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
    throw new Error(err.response?.data?.error?.message || err.message);
  }
};

const formatProfile = (data, searchCity, searchProfession, likes = 0, comments = 0) => ({
  name: data.name || '',
  username: data.username || '',
  bio: data.biography || '',
  city: searchCity,
  followers: data.followers_count || 0,
  following: data.follows_count || 0,
  posts: data.media_count || 0,
  engagementRate: parseFloat(calcEngagement(likes, comments, data.followers_count)),
  accountType: data.account_type || 'Personal',
  profilePic: data.profile_picture_url || '',
  profileUrl: `https://instagram.com/${data.username}`,
  lastPost: null,
});

module.exports = { searchProfiles };
