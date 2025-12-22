import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BookCard } from '../components/BookCard';
import { Book } from '../types';

// Mock dependencies
vi.mock('../services/gemini', () => ({
    generateAudioPreview: vi.fn(),
}));

vi.mock('../services/storage', () => ({
    isInWishlist: vi.fn(() => false),
    toggleWishlist: vi.fn(),
}));

// Mock BookCover to simplify test
vi.mock('../components/BookCover', () => ({
    BookCover: () => <div data-testid="book-cover">Cover</div>,
}));

describe('BookCard Component', () => {
    const mockBook: Book = {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '1234567890',
        description: 'A classic novel.',
        moodColor: '#FFD700',
        genre: 'Classic',
        language: 'English',
        averageRating: 4.5,
        ratingsCount: 1000,
        reasoning: 'Because it is great',
        excerpt: 'In my younger and more vulnerable years...'
    };

    it('renders book title and author correctly', () => {
        render(<BookCard book={mockBook} index={0} />);

        expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
        expect(screen.getByText('F. Scott Fitzgerald')).toBeInTheDocument();
        expect(screen.getByText('Classic')).toBeInTheDocument();
    });

    it('renders rating correctly', () => {
        render(<BookCard book={mockBook} index={0} />);
        expect(screen.getByText('4.5')).toBeInTheDocument();
        expect(screen.getByText('(1,000 ratings)')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        const handleClick = vi.fn();
        render(<BookCard book={mockBook} index={0} onClick={handleClick} />);

        fireEvent.click(screen.getByText('The Great Gatsby'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });
});
