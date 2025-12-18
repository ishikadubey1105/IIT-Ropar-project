
import React, { useRef } from 'react';
import { Book } from '../types';
import { BookCard } from './BookCard';

interface BookRowProps {
  title: string;
  books: Book[];
  onBookClick: (book: Book) => void;
  isRecommendation?: boolean;
}

export const BookRow: React.FC<BookRowProps> = ({ title, books, onBookClick, isRecommendation }) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { current } = rowRef;
      const scrollAmount = direction === 'left' ? -window.innerWidth / 1.5 : window.innerWidth / 1.5;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (books.length === 0) return null;

  return (
    <div className="mb-20 pl-6 md:pl-12 relative group/row animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-2xl md:text-4xl text-white font-medium font-serif tracking-wide drop-shadow-lg">
          {title}
          {isRecommendation && (
            <span className="ml-4 text-[10px] md:text-xs text-accent-gold uppercase tracking-widest bg-accent-gold/10 px-3 py-1 rounded-full border border-accent-gold/20 align-middle">
              A.I. Curated
            </span>
          )}
        </h2>
        <div className="h-[1px] bg-gradient-to-r from-accent-gold/50 to-transparent flex-1 mt-2"></div>
      </div>
      
      <div className="group relative">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-40 bg-gradient-to-r from-black/90 to-transparent w-20 md:w-24 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 hover:w-28"
        >
           <svg className="w-10 h-10 text-white drop-shadow-lg transform hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        </button>

        <div 
          ref={rowRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-16 snap-x pr-20 items-stretch"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {books.map((book, i) => (
            <div 
              key={`${book.title}-${i}`} 
              className="flex-none shrink-0 w-[200px] md:w-[280px] snap-start"
            >
              <BookCard 
                book={book} 
                index={i} 
                onClick={() => onBookClick(book)} 
              />
            </div>
          ))}
        </div>

        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-40 bg-gradient-to-l from-black/90 to-transparent w-20 md:w-24 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 hover:w-28"
        >
           <svg className="w-10 h-10 text-white drop-shadow-lg transform hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
};
