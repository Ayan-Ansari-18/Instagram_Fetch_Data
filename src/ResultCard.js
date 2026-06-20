import React, { memo } from 'react';
import './ResultCard.css';

const ResultCard = memo(({ profile }) => {
  const { name, username, bio, city, followers, following, posts, engagementRate, accountType, profileUrl, profilePic } = profile;
  const engagementColor = engagementRate > 3 ? '#4caf50' : engagementRate >= 1 ? '#ff9800' : '#f44336';

  return (
    <div className="result-card">
      <div className="card-header">
        <img src={profilePic || '/default-avatar.png'} alt={name} className="avatar" loading="lazy" />
        <div>
          <p className="card-name">{name}</p>
          <p className="card-username">@{username}</p>
          <p className="card-city">{city}</p>
        </div>
      </div>
      <p className="card-bio">{bio}</p>
      <div className="card-stats">
        <span>{Number(followers).toLocaleString()} Followers</span>
        <span>{Number(following).toLocaleString()} Following</span>
        <span>{posts} Posts</span>
      </div>
      <div className="card-footer">
        <span className="engagement" style={{ color: engagementColor }}>{engagementRate}% Engagement</span>
        <span className="account-type">{accountType}</span>
        <a href={profileUrl} target="_blank" rel="noreferrer" className="open-btn">Open Profile</a>
      </div>
    </div>
  );
});

export default ResultCard;
