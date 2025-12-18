
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
        x: (e.clientX / window.innerWidth - 0.5) * 15,
        y: (e.clientY / window.innerHeight - 0.5) * 15
      });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  if (!featuredBook) return null;

  return (
    <div className="relative min-h-[95vh] w-full overflow-hidden flex flex-col justify-center pb-20 px-6 md:px-12 pt-40 group">
      
      {/* --- CINEMATIC BACKGROUND --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div 
            className="absolute inset-0 w-full h-full transition-transform duration-75 ease-out" 
            style={{ transform: `translate(${offset.x * -1}px, ${offset.y * -1}px) scale(1.1)` }}
         >
            <div className="w-full h-full animate-ken-burns">
                {featuredBook.coverUrl ? (
                    <img 
                        src={featuredBook.coverUrl} 
                        alt="Background" 
                        className="w-full h-full object-cover blur-[4px] opacity-40 md:opacity-50"
                    />
                ) : (
                    <div className="w-full h-full" style={{ backgroundColor: featuredBook.moodColor, opacity: 0.3 }} />
                )}
            </div>
         </div>
         <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
         <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent" />
      </div>

      {/* --- CONTENT --- */}
      <div 
        className={`relative z-20 max-w-4xl w-full transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="flex items-center gap-3 mb-6">
            <span className="text-accent-gold font-bold tracking-widest text-[10px] md:text-xs uppercase border border-accent-gold/40 px-3 py-1 bg-black/60 rounded backdrop-blur-md">
                Featured Atmospheric Discovery
            </span>
            {featuredBook.cognitiveEffort && (
              <span className="text-slate-400 text-[10px] md:text-xs px-2 py-1 bg-white/5 rounded border border-white/10 uppercase tracking-wider">
                {featuredBook.cognitiveEffort} Depth
              </span>
            )}
        </div>

        <h1 className="text-5xl md:text-8xl font-serif font-bold text-white mb-6 leading-[0.9] tracking-tight drop-shadow-2xl">
          {featuredBook.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm font-medium text-slate-300 mb-8">
            <span className="text-green-400 font-bold px-2 py-0.5 bg-green-950/30 rounded border border-green-900/40">Highly Compatible</span>
            <span className="opacity-80">by {featuredBook.author}</span>
            <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
            <span className="text-accent-gold italic font-serif">{featuredBook.atmosphericRole || 'Immersive'} Role</span>
        </div>

        <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed font-light max-w-2xl line-clamp-3 md:line-clamp-none">
          {featuredBook.description}
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={onStart} 
            className="px-10 py-4 rounded bg-white text-black font-bold text-lg hover:bg-accent-gold transition-all flex items-center justify-center gap-3 shadow-2xl"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            Curate My Mood
          </button>
          <button 
            onClick={onBrowse} 
            className="px-10 py-4 rounded bg-slate-800/60 text-white font-bold text-lg backdrop-blur-xl border border-white/10 hover:bg-slate-700 transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            Browse All
          </button>
          <button 
            onClick={() => onMoreInfo(featuredBook)} 
            className="px-6 py-4 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest flex items-center gap-2"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};
