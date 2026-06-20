import React, { memo } from 'react';
import ResultCard from './ResultCard';
import './ResultsList.css';

const ResultsList = memo(({ results, loading, searched }) => {
  if (loading) {
    return (
      <div className="results-grid">
        {[1, 2, 3].map(i => <div key={i} className="skeleton-card" />)}
      </div>
    );
  }

  if (searched && results.length === 0) {
    return <p className="no-results">Koi profile nahi mila. Dusri city ya profession try karo.</p>;
  }

  return (
    <div className="results-grid">
      {results.map(profile => <ResultCard key={profile.username} profile={profile} />)}
    </div>
  );
});

export default ResultsList;
