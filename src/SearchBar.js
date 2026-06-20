import React, { useState, useCallback, useRef } from 'react';
import './SearchBar.css';

const SearchBar = ({ onSearch }) => {
  const [form, setForm] = useState({ city: '', profession: '', followers: '', username: '' });
  const debounceRef = useRef(null);

  const handleChange = useCallback((e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleSearch = useCallback(() => {
    if (!form.city || !form.profession) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(form), 300);
  }, [form, onSearch]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') handleSearch();
  }, [handleSearch]);

  return (
    <div className="searchbar">
      <div className="searchbar-container">
        <input name="city" value={form.city} onChange={handleChange} onKeyDown={handleKeyDown} placeholder="Enter City (e.g. Mumbai)" />
        <input name="profession" value={form.profession} onChange={handleChange} onKeyDown={handleKeyDown} placeholder="Enter Profession (e.g. Fitness Trainer)" />
        <input name="followers" value={form.followers} onChange={handleChange} onKeyDown={handleKeyDown} placeholder="Followers Range (e.g. 5000-50000)" />
        <input name="username" value={form.username} onChange={handleChange} onKeyDown={handleKeyDown} placeholder="@username (optional)" />
        <button onClick={handleSearch} disabled={!form.city || !form.profession}>Search</button>
      </div>
    </div>
  );
};

export default SearchBar;
