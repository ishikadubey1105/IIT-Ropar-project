
import React, { useRef } from 'react';
import { Book } from '../types';
import { BookCover } from './BookCover';

interface BookRowProps {
  title: string;
  books: Book[];
  onBookClick: (book: Book) => void;
  // Added isRecommendation to props to handle the selection indicator and fix TS errors
  isRecommendation?: boolean;
}

export const BookRow: React.FC<BookRowProps> = ({ title, books, onBookClick, isRecommendation }) => {
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
    <div className="mb-16 pl-6 md:pl-12 relative group/row animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl md:text-4xl text-white font-medium font-serif tracking-wide drop-shadow-lg">
          {title}
          {/* Display a badge if this row contains AI-curated recommendations */}
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
          className="absolute left-0 top-0 bottom-0 z-40 bg-gradient-to-r from-black/80 to-transparent w-16 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:w-20"
        >
           <svg className="w-8 h-8 text-white drop-shadow-lg transform hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        </button>

        <div 
          ref={rowRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-12 snap-x pr-12 items-stretch"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {books.map((book, i) => (
            <div 
              key={`${book.title}-${i}`} 
              onClick={() => onBookClick(book)}
              className="flex-none w-[160px] md:w-[220px] aspect-[2/3] relative rounded-lg overflow-hidden cursor-pointer transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] snap-start shadow-xl group/card border border-white/5 opacity-0 animate-fade-in"
              style={{ 
                animationDelay: `${i * 100}ms`, 
                animationFillMode: 'forwards' 
              }} 
            >
              <BookCover 
                isbn={book.isbn} 
                title={book.title} 
                author={book.author} 
                moodColor={book.moodColor}
                className="w-full h-full"
              />
              
              {/* Hover overlay info */}
              <div className="absolute inset-0 bg-black/80 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm z-20">
                 <div className="transform translate-y-4 group-hover/card:translate-y-0 transition-transform duration-300">
                   <h4 className="text-white font-serif font-bold mb-3 line-clamp-2 text-lg">{book.title}</h4>
                   <p className="text-xs text-slate-300 mb-6 line-clamp-3 leading-relaxed font-light">{book.description}</p>
                   <span className="text-accent-gold text-xs uppercase tracking-wider border border-accent-gold/50 px-4 py-2 rounded-full hover:bg-accent-gold hover:text-black transition-colors font-bold shadow-lg">
                     Explore
                   </span>
                 </div>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-40 bg-gradient-to-l from-black/80 to-transparent w-16 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:w-20"
        >
           <svg className="w-8 h-8 text-white drop-shadow-lg transform hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
};
