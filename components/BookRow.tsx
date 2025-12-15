import React, { useRef } from 'react';
import { Book } from '../types';
import { BookCover } from './BookCover';

interface BookRowProps {
  title: string;
  books: Book[];
  onBookClick: (book: Book) => void;
}

export const BookRow: React.FC<BookRowProps> = ({ title, books, onBookClick }) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { current } = rowRef;
      const scrollAmount = direction === 'left' ? -window.innerWidth / 2 : window.innerWidth / 2;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (books.length === 0) return null;

  return (
    <div className="mb-12 pl-6 md:pl-12 relative group/row">
      <h2 className="text-2xl md:text-3xl text-slate-100 font-medium mb-6 font-serif tracking-wide">{title}</h2>
      
      <div className="group relative">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-40 bg-gradient-to-r from-black/80 to-transparent w-16 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
           <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        </button>

        <div 
          ref={rowRef}
          className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-12 snap-x pr-12"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {books.map((book, i) => (
            <div 
              key={i} 
              onClick={() => onBookClick(book)}
              className="flex-none w-[160px] md:w-[220px] aspect-[2/3] relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10 snap-start shadow-xl group/card border border-slate-800 hover:border-accent-gold/50"
            >
              <BookCover 
                isbn={book.isbn} 
                title={book.title} 
                author={book.author} 
                moodColor={book.moodColor}
                className="w-full h-full"
              />
              
              {/* Hover overlay info */}
              <div className="absolute inset-0 bg-black/90 opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm z-20">
                 <h4 className="text-white font-serif font-bold mb-2 line-clamp-2">{book.title}</h4>
                 <p className="text-xs text-slate-300 mb-4 line-clamp-4 leading-relaxed">{book.description}</p>
                 <span className="text-accent-gold text-xs uppercase tracking-wider border border-accent-gold px-3 py-1.5 rounded-full hover:bg-accent-gold hover:text-black transition-colors font-bold">
                   View Details
                 </span>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-40 bg-gradient-to-l from-black/80 to-transparent w-16 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
           <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
};