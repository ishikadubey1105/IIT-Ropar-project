import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { getActiveRead } from '../services/storage';
import { BookCover } from './BookCover';

interface NavbarProps {
  onHome: () => void;
  onWishlist: () => void;
  onSearch: (q: string) => void;
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onHome, onWishlist, onSearch, className = '' }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [search, setSearch] = useState('');
  const [activeRead, setActiveRead] = useState<Book | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    // Load initial active read
    setActiveRead(getActiveRead());

    // Listen for updates
    const handleActiveUpdate = () => setActiveRead(getActiveRead());
    window.addEventListener('active-read-updated', handleActiveUpdate);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('active-read-updated', handleActiveUpdate);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(search);
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 flex items-center justify-between px-6 md:px-12 py-6 md:py-8 ${isScrolled ? 'bg-[#0a0a0c]/95 backdrop-blur-md shadow-lg h-24' : 'bg-gradient-to-b from-black/80 to-transparent h-28'} ${className}`}>
      <div className="flex items-center gap-6 md:gap-10">
        <button onClick={onHome} className="text-2xl md:text-3xl font-serif font-bold text-accent-gold tracking-widest hover:scale-105 transition-transform drop-shadow-md">
          ATMOSPHERA
        </button>
        <div className="hidden md:flex gap-8 text-base font-medium text-slate-300">
          <button onClick={onHome} className="hover:text-white transition-colors hover:border-b-2 border-accent-gold pb-1">Home</button>
          <button onClick={onWishlist} className="hover:text-white transition-colors hover:border-b-2 border-accent-gold pb-1">My List</button>
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
             
             {/* Tooltip */}
             <div className="absolute top-full mt-2 right-0 w-56 bg-slate-900 border border-slate-700 p-4 rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <p className="text-xs text-slate-400 italic">"Resume where you left off..."</p>
             </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative group">
          <input 
            type="text" 
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-black/40 border border-slate-600 rounded-full px-5 py-2.5 w-32 md:w-48 focus:w-64 transition-all duration-300 text-sm text-white focus:outline-none focus:border-accent-gold shadow-inner"
          />
          <svg className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </form>
        
        <div className="w-10 h-10 rounded-full bg-accent-gold text-black font-serif font-bold text-lg flex items-center justify-center shadow-lg hover:bg-white transition-colors cursor-pointer">
           A
        </div>
      </div>
    </nav>
  );
};