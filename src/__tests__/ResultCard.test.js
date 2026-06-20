import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResultCard from '../ResultCard';

const baseProfile = {
  name: 'Priya Sharma',
  username: 'priya.fitness',
  bio: 'Certified Fitness Trainer',
  city: 'Mumbai',
  followers: 12000,
  following: 400,
  posts: 85,
  engagementRate: 4.2,
  accountType: 'Creator',
  profilePic: '',
  profileUrl: 'https://instagram.com/priya.fitness',
  lastPost: null,
};

describe('ResultCard', () => {
  it('displays name and username', () => {
    render(<ResultCard profile={baseProfile} />);
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByText('@priya.fitness')).toBeInTheDocument();
  });

  it('displays follower count formatted', () => {
    render(<ResultCard profile={baseProfile} />);
    expect(screen.getByText(/12,000 followers/i)).toBeInTheDocument();
  });

  it('displays engagement rate', () => {
    render(<ResultCard profile={baseProfile} />);
    expect(screen.getByText(/4.2% engagement/i)).toBeInTheDocument();
  });

  it('engagement color is green when > 3%', () => {
    render(<ResultCard profile={baseProfile} />);
    const el = screen.getByText(/4.2% engagement/i);
    expect(el).toHaveStyle({ color: '#4caf50' });
  });

  it('engagement color is orange when between 1-3%', () => {
    render(<ResultCard profile={{ ...baseProfile, engagementRate: 2 }} />);
    const el = screen.getByText(/2% engagement/i);
    expect(el).toHaveStyle({ color: '#ff9800' });
  });

  it('engagement color is red when < 1%', () => {
    render(<ResultCard profile={{ ...baseProfile, engagementRate: 0.5 }} />);
    const el = screen.getByText(/0.5% engagement/i);
    expect(el).toHaveStyle({ color: '#f44336' });
  });

  it('open profile link has correct href', () => {
    render(<ResultCard profile={baseProfile} />);
    const link = screen.getByRole('link', { name: /open profile/i });
    expect(link).toHaveAttribute('href', 'https://instagram.com/priya.fitness');
  });

  it('open profile link opens in new tab', () => {
    render(<ResultCard profile={baseProfile} />);
    const link = screen.getByRole('link', { name: /open profile/i });
    expect(link).toHaveAttribute('target', '_blank');
  });
});
