import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '' : (process.env.REACT_APP_API_URL || 'http://localhost:5000'),
  timeout: 10000,
});

export const searchInstagram = async ({ city, profession, followers, username }, signal) => {
  const res = await api.get('/api/search', {
    params: { city, profession, followers, username },
    signal,
  });
  return res.data.results;
};
