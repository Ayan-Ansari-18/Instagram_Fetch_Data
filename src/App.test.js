import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

jest.mock('./api', () => ({ searchInstagram: jest.fn() }));
jest.mock('./excelExport', () => ({ exportToExcel: jest.fn() }));

describe('App', () => {
  it('renders navbar brand name', () => {
    render(<App />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getAllByText('Universal Skill').length).toBeGreaterThan(0);
  });

  it('renders search bar inputs', () => {
    render(<App />);
    expect(screen.getByPlaceholderText(/enter city/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter profession/i)).toBeInTheDocument();
  });

  it('shows hero content before search', () => {
    render(<App />);
    expect(screen.getByText(/easily search and rank/i)).toBeInTheDocument();
  });
});
