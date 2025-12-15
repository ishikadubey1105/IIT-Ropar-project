import React from 'react';
import { Book } from '../types';

interface BookCardProps {
  book: Book;
  index: number;
}

export const BookCard: React.FC<BookCardProps> = ({ book, index }) => {
  return (
    <div 
      className="group relative w-full bg-slate-800 rounded-xl overflow-hidden shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-accent-gold/10"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {/* Dynamic Accent Border based on Mood Color */}
      <div 
        className="absolute top-0 left-0 w-full h-1.5"
        style={{ backgroundColor: book.moodColor }}
      />
      
      <div className="p-6 md:p-8 flex flex-col h-full">
        <div className="mb-4">
          <span className="text-xs uppercase tracking-widest text-slate-400 border border-slate-700 px-2 py-1 rounded-md">
            {book.genre}
          </span>
        </div>

        <h3 className="text-2xl font-serif font-bold text-white mb-1 group-hover:text-accent-gold transition-colors">
          {book.title}
        </h3>
        <p className="text-sm font-medium text-slate-400 mb-6 italic">by {book.author}</p>

        <div className="bg-slate-900/50 p-4 rounded-lg mb-6 border-l-2 border-slate-700">
           <p className="text-slate-300 text-sm leading-relaxed">
             "{book.description}"
           </p>
        </div>

        {book.firstSentence && (
          <div className="mb-6">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Opening Line</p>
            <p className="font-serif-italic text-lg text-slate-200 leading-snug">
              “{book.firstSentence}”
            </p>
          </div>
        )}

        <div className="mt-auto pt-6 border-t border-slate-700/50">
          <div className="flex items-start gap-3">
            <div className="mt-1 min-w-[20px]">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent-gold" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
               </svg>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              <span className="font-semibold text-accent-gold">Why it fits:</span> {book.reasoning}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};