import React, { useEffect, useState } from 'react';
import { Button } from './Button';
import { Book } from '../types';
import { BookCover } from './BookCover';

interface HeroProps {
  onStart: () => void;
  onBrowse: () => void;
  featuredBook: Book | null;
  onMoreInfo: (book: Book) => void;
}

export const Hero: React.FC<HeroProps> = ({ onStart, onBrowse, featuredBook, onMoreInfo }) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const handleMove = (e: MouseEvent) => {
      setOffset({
        x: (e.clientX / window.innerWidth - 0.5) * 20, // Increased sensitivity for more noticeable parallax
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  if (!featuredBook) {
    // Fallback loading state
    return (
        <div className="relative h-[80vh] w-full bg-[#0a0a0c] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="h-8 w-64 bg-slate-800 rounded"></div>
                <div className="h-4 w-48 bg-slate-800 rounded"></div>
            </div>
        </div>
    );
  }

  return (
    <div className="relative h-[85vh] w-full overflow-hidden flex items-end pb-20 md:pb-32 px-6 md:px-12 group">
      
      {/* --- CINEMATIC BACKGROUND --- */}
      <div className="absolute inset-0 z-0">
         {/* Parallax Container - Responds to mouse */}
         <div 
            className="absolute inset-0 w-full h-full transition-transform duration-75 ease-out will-change-transform" 
            style={{ transform: `translate(${offset.x * -1}px, ${offset.y * -1}px) scale(1.05)` }}
         >
            {/* Ken Burns Container - Automatic Slow Motion */}
            <div className="w-full h-full animate-ken-burns">
                {featuredBook.coverUrl ? (
                    <img 
                        src={featuredBook.coverUrl} 
                        alt="Background" 
                        className="w-full h-full object-cover blur-sm opacity-60 mask-image-b"
                    />
                ) : (
                    <div className="w-full h-full" style={{ backgroundColor: featuredBook.moodColor }}>
                        <BookCover 
                            title={featuredBook.title} 
                            author={featuredBook.author} 
                            moodColor={featuredBook.moodColor}
                            className="w-full h-full opacity-50 blur-xl"
                            showText={false}
                        />
                    </div>
                )}
            </div>
         </div>
         
         {/* Layer 2: Gradient Overlays for Readability (Netflix Style) */}
         <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
         <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/40 to-transparent" />
         <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/80 to-transparent" />
      </div>

      {/* --- CONTENT --- */}
      <div 
        className={`relative z-20 max-w-2xl w-full flex flex-col items-start transition-opacity duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        style={{ transform: `translate(${offset.x * 0.5}px, ${offset.y * 0.5}px)` }} // Counter-parallax for 3D depth
      >
        
        {/* Spotlight Label */}
        <div className="flex items-center gap-2 mb-4 animate-fade-in">
            <span className="text-accent-gold font-bold tracking-widest text-xs uppercase border border-accent-gold/30 px-2 py-1 bg-black/40 backdrop-blur-md rounded">
                #1 in {featuredBook.genre}
            </span>
            <span className="text-slate-300 text-xs font-serif italic tracking-wide">
                Based on your vibes
            </span>
        </div>

        {/* Title (Big Typography) */}
        <h1 
            className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white mb-6 leading-[0.9] drop-shadow-2xl origin-left"
            style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
        >
          {featuredBook.title}
        </h1>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm font-medium text-slate-300 mb-6">
            <span className="text-green-400 font-bold">98% Match</span>
            <span>{featuredBook.publishedDate?.substring(0, 4) || 'Classic'}</span>
            <span className="border border-slate-500 px-1 text-[10px] rounded">HD</span>
            <span>{featuredBook.author}</span>
        </div>

        {/* Synopsis */}
        <p className="text-lg md:text-xl text-slate-200 mb-8 leading-relaxed shadow-black drop-shadow-lg line-clamp-3 font-light max-w-xl">
          {featuredBook.description}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-row gap-4 w-full sm:w-auto">
          <button 
            onClick={onStart} 
            className="px-8 py-3 md:py-4 rounded-md text-lg font-bold bg-white text-black hover:bg-slate-200 transition-colors flex items-center justify-center gap-3 shadow-xl min-w-[160px]"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            Curate Mood
          </button>

          <button 
            onClick={() => onMoreInfo(featuredBook)} 
            className="px-8 py-3 md:py-4 rounded-md text-lg font-bold bg-gray-500/40 text-white backdrop-blur-md hover:bg-gray-500/60 transition-colors flex items-center justify-center gap-3 min-w-[160px]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            More Info
          </button>
        </div>
      </div>

      {/* Right Side Book Cover (Desktop Only - Optional subtle display) */}
      <div 
        className="hidden lg:block absolute right-20 bottom-32 z-10 w-64 aspect-[2/3] shadow-2xl rounded-lg overflow-hidden border border-white/10 opacity-80 rotate-6 hover:rotate-0 transition-all duration-700 hover:scale-105 hover:opacity-100 group cursor-pointer animate-float"
        onClick={() => onMoreInfo(featuredBook)}
        style={{ animationDelay: '1s' }}
      >
           <BookCover 
             title={featuredBook.title}
             author={featuredBook.author}
             moodColor={featuredBook.moodColor}
             isbn={featuredBook.isbn}
             coverUrl={featuredBook.coverUrl}
             className="w-full h-full"
           />
           <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
      </div>
    </div>
  );
};