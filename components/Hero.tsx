
import React, { useEffect, useState } from 'react';
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
    <div className="relative min-h-[110vh] w-full overflow-hidden flex flex-col justify-center pb-32 px-6 md:px-12 pt-40 group">
      
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
                        className="w-full h-full object-cover blur-[10px] opacity-40 md:opacity-50 saturate-[0.8]"
                    />
                ) : (
                    <div className="w-full h-full" style={{ backgroundColor: featuredBook.moodColor, opacity: 0.2 }} />
                )}
            </div>
         </div>
         <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-transparent" />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      {/* --- CONTENT --- */}
      <div 
        className={`relative z-20 max-w-7xl w-full transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="flex items-center gap-3 mb-12">
            <span className="text-accent-gold font-bold tracking-[0.4em] text-[10px] md:text-xs uppercase border border-accent-gold/40 px-4 py-2 bg-black/80 rounded-sm backdrop-blur-xl shadow-2xl">
                Featured Discovery
            </span>
            <div className="w-8 h-[1px] bg-accent-gold/30"></div>
            <span className="text-slate-500 text-[10px] md:text-xs font-mono uppercase tracking-widest opacity-60">
                18.12.25 Archival Sync
            </span>
        </div>

        <h1 className="text-6xl md:text-[11rem] font-serif font-bold text-white mb-20 md:mb-24 leading-[0.85] tracking-tighter drop-shadow-[0_20px_50px_rgba(0,0,0,1)] selection:bg-accent-gold selection:text-black max-w-6xl">
          {featuredBook.title}
        </h1>

        <div className="flex flex-wrap items-start gap-y-10 gap-x-12 md:gap-x-20 text-xs md:text-base font-medium text-slate-300 mb-20 border-l-2 border-accent-gold/60 pl-8 ml-2">
            <div className="flex flex-col gap-2">
               <span className="text-emerald-500/90 font-bold tracking-[0.2em] uppercase text-[9px] mb-1">Atmospheric Weight</span>
               <span className="text-white font-serif italic text-2xl md:text-3xl">Highly Compatible</span>
            </div>
            <div className="hidden lg:block h-16 w-[1px] bg-white/10 self-center"></div>
            <div className="flex flex-col gap-2">
               <span className="text-slate-500 font-bold tracking-[0.2em] uppercase text-[9px] mb-1">Created By</span>
               <span className="text-slate-100 font-serif italic text-2xl md:text-3xl">{featuredBook.author}</span>
            </div>
            <div className="hidden lg:block h-16 w-[1px] bg-white/10 self-center"></div>
            <div className="flex flex-col gap-2">
               <span className="text-accent-gold font-bold tracking-[0.2em] uppercase text-[9px] mb-1">Curation Role</span>
               <span className="text-accent-gold font-serif italic text-2xl md:text-3xl">{featuredBook.atmosphericRole || 'Global Sensation'}</span>
            </div>
        </div>

        <div className="relative mb-20 max-w-4xl">
           <div className="absolute -left-6 top-0 bottom-0 w-[2px] bg-gradient-to-b from-accent-gold via-accent-gold/40 to-transparent"></div>
           <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 p-10 rounded-tr-[5rem] rounded-bl-[1.5rem] shadow-2xl relative overflow-hidden group/desc">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold/5 blur-[120px] group-hover/desc:bg-accent-gold/10 transition-colors"></div>
              <p className="text-xl md:text-3xl text-slate-100 leading-relaxed font-serif italic font-light tracking-tight drop-shadow-md relative z-10">
                 <span className="text-accent-gold/40 text-6xl absolute -left-8 -top-8 font-serif leading-none">“</span>
                 {featuredBook.description}
                 <span className="text-accent-gold/40 text-6xl absolute -right-8 -bottom-12 font-serif leading-none">”</span>
              </p>
              <div className="mt-8 flex items-center gap-4">
                 <div className="flex gap-1.5">
                    {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent-gold opacity-30"></div>)}
                 </div>
                 <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-slate-600">A.I. Synthesized Vibe</span>
              </div>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          <button 
            onClick={onStart} 
            className="px-16 py-7 rounded-sm bg-white text-black font-bold text-xl hover:bg-accent-gold transition-all flex items-center justify-center gap-4 shadow-[0_30px_60px_-15px_rgba(212,175,55,0.4)] group/btn relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
            <svg className="w-8 h-8 transform group-hover/btn:scale-125 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            Curate My Mood
          </button>
          
          <button 
            onClick={onBrowse} 
            className="px-16 py-7 rounded-sm bg-slate-900/40 text-white font-bold text-xl backdrop-blur-3xl border border-white/10 hover:border-accent-gold/50 hover:bg-slate-800 transition-all flex items-center justify-center gap-4 group/browse"
          >
            Browse Genres
          </button>
          
          <button 
            onClick={() => onMoreInfo(featuredBook)} 
            className="px-8 py-7 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-[0.4em] flex items-center gap-4 group/info ml-auto md:ml-6"
          >
            Deep Archive
            <div className="w-12 h-[1px] bg-slate-700 group-hover:w-20 group-hover:bg-accent-gold transition-all"></div>
          </button>
        </div>
      </div>
    </div>
  );
};
