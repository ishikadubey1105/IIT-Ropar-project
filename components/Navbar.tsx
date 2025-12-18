
import React, { useState, useEffect, useRef } from 'react';
import { Book } from '../types';
import { getActiveRead } from '../services/storage';
import { BookCover } from './BookCover';

interface NavbarProps {
  onHome: () => void;
  onWishlist: () => void;
  onSearchClick: () => void;
  onGenresClick?: () => void;
  onSearch: (q: string) => void;
  searchValue: string;
  onSearchChange: (val: string) => void;
  activeView: 'home' | 'curate' | 'search' | 'genres';
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onHome, 
  onWishlist, 
  onSearchClick, 
  onGenresClick,
  onSearch, 
  searchValue,
  onSearchChange,
  activeView,
  className = '' 
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeRead, setActiveRead] = useState<Book | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    setActiveRead(getActiveRead());
    const handleActiveUpdate = () => setActiveRead(getActiveRead());
    window.addEventListener('active-read-updated', handleActiveUpdate);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('active-read-updated', handleActiveUpdate);
    };
  }, []);

  // Auto-focus search on search view if empty
  useEffect(() => {
    if (activeView === 'search' && !searchValue && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeView]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
    // Blur to hide keyboard on mobile / remove focus ring
    inputRef.current?.blur();
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 flex items-center justify-between px-6 md:px-12 py-6 md:py-8 ${isScrolled || activeView === 'search' ? 'bg-[#0a0a0c]/95 backdrop-blur-md shadow-lg h-24' : 'bg-gradient-to-b from-black/80 to-transparent h-28'} ${className}`}>
      <div className="flex items-center gap-6 md:gap-10">
        <button onClick={onHome} className="text-2xl md:text-3xl font-serif font-bold text-accent-gold tracking-widest hover:scale-105 transition-transform drop-shadow-md">
          ATMOSPHERA
        </button>
        <div className="hidden md:flex gap-8 text-base font-medium text-slate-300">
          <button 
            onClick={onHome} 
            className={`transition-colors border-b-2 pb-1 ${activeView === 'home' ? 'text-white border-accent-gold' : 'border-transparent hover:text-white hover:border-accent-gold/50'}`}
          >
            Home
          </button>
          <button 
            onClick={onGenresClick} 
            className={`transition-colors border-b-2 pb-1 ${activeView === 'genres' ? 'text-white border-accent-gold' : 'border-transparent hover:text-white hover:border-accent-gold/50'}`}
          >
            Genres
          </button>
          <button 
            onClick={onSearchClick} 
            className={`transition-colors border-b-2 pb-1 ${activeView === 'search' ? 'text-white border-accent-gold' : 'border-transparent hover:text-white hover:border-accent-gold/50'}`}
          >
            Search
          </button>
          <button onClick={onWishlist} className="hover:text-white transition-colors border-b-2 border-transparent hover:border-accent-gold pb-1">
            My List
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-8">
        {activeRead && (
          <div className="hidden lg:flex items-center gap-4 bg-white/10 rounded-full px-4 py-2 animate-fade-in border border-white/10 hover:border-accent-gold/50 transition-colors cursor-pointer group relative">
             <div className="w-8 h-10 rounded-sm overflow-hidden shadow-sm shrink-0">
               <BookCover 
                 isbn={activeRead.isbn} 
                 title={activeRead.title} 
                 author={activeRead.author} 
                 moodColor={activeRead.moodColor} 
                 showText={false}
                 className="w-full h-full"
               />
             </div>
             
             <div className="flex flex-col">
               <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Reading Now</span>
               <span className="text-sm font-serif text-white max-w-[150px] truncate">{activeRead.title}</span>
             </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative group">
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Search books..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-black/40 border border-slate-600 rounded-full px-5 py-2.5 w-32 md:w-48 focus:w-64 transition-all duration-300 text-sm text-white focus:outline-none focus:border-accent-gold shadow-inner placeholder-slate-500"
          />
          <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </button>
        </form>
        
        <div className="w-10 h-10 rounded-full bg-accent-gold text-black font-serif font-bold text-lg flex items-center justify-center shadow-lg hover:bg-white transition-colors cursor-pointer">
           A
        </div>
      </div>
    </nav>
  );
};
