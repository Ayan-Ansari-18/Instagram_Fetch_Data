import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchBar from '../SearchBar';

describe('SearchBar', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  it('renders all 4 input fields', () => {
    render(<SearchBar onSearch={jest.fn()} />);
    expect(screen.getByPlaceholderText(/enter city/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter profession/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/followers range/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/@username/i)).toBeInTheDocument();
  });

  it('search button is disabled when city or profession is empty', () => {
    render(<SearchBar onSearch={jest.fn()} />);
    expect(screen.getByRole('button', { name: /search/i })).toBeDisabled();
  });

  it('search button enables when city and profession are filled', () => {
    render(<SearchBar onSearch={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/enter city/i), { target: { value: 'Mumbai' } });
    fireEvent.change(screen.getByPlaceholderText(/enter profession/i), { target: { value: 'Trainer' } });
    expect(screen.getByRole('button', { name: /search/i })).not.toBeDisabled();
  });

  it('calls onSearch with correct form data', () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);
    fireEvent.change(screen.getByPlaceholderText(/enter city/i), { target: { value: 'Mumbai' } });
    fireEvent.change(screen.getByPlaceholderText(/enter profession/i), { target: { value: 'Trainer' } });
    fireEvent.change(screen.getByPlaceholderText(/followers range/i), { target: { value: '5000-50000' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    act(() => jest.runAllTimers());
    expect(onSearch).toHaveBeenCalledWith({ city: 'Mumbai', profession: 'Trainer', followers: '5000-50000', username: '' });
  });

  it('does not call onSearch when city is empty', () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);
    fireEvent.change(screen.getByPlaceholderText(/enter profession/i), { target: { value: 'Trainer' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    expect(onSearch).not.toHaveBeenCalled();
  });
});
