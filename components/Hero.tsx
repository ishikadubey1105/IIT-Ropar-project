
import React, { useEffect, useState, useRef } from 'react';
import { Book } from '../types';

interface HeroProps {
  onStart: () => void;
  onBrowse: () => void;
  featuredBook: Book | null;
  onMoreInfo: (book: Book) => void;
  isLoading?: boolean;
}

export const Hero: React.FC<HeroProps> = ({ onStart, onBrowse, featuredBook, onMoreInfo, isLoading }) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setIsVisible(true);
    
    const handleMove = (e: MouseEvent) => {
      if (rafRef.current) return;
      
      rafRef.current = requestAnimationFrame(() => {
        setOffset({
          x: (e.clientX / window.innerWidth - 0.5) * 15,
          y: (e.clientY / window.innerHeight - 0.5) * 15
        });
        rafRef.current = null;
      });
    };

    window.addEventListener('mousemove', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // SKELETON LOADING STATE
  if (isLoading || !featuredBook) {
    return (
      <div className="relative min-h-[90vh] w-full flex flex-col justify-center pb-32 px-6 md:px-12 pt-32 overflow-hidden">
        {/* Animated Background Placeholder */}
        <div className="absolute inset-0 z-0 bg-[#0a0a0c]">
           <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 animate-shimmer opacity-20" />
        </div>
        
        <div className="relative z-20 max-w-7xl w-full animate-pulse space-y-8">
           <div className="w-48 h-6 bg-slate-800 rounded-full mb-8" />
           <div className="space-y-4 max-w-4xl">
              <div className="w-3/4 h-16 md:h-24 bg-slate-800 rounded-lg" />
              <div className="w-1/2 h-16 md:h-24 bg-slate-800 rounded-lg" />
           </div>
           
           <div className="flex gap-12 py-8 border-l-2 border-slate-800 pl-6">
              <div className="space-y-2">
                 <div className="w-24 h-3 bg-slate-800 rounded" />
                 <div className="w-32 h-6 bg-slate-800 rounded" />
              </div>
              <div className="space-y-2">
                 <div className="w-24 h-3 bg-slate-800 rounded" />
                 <div className="w-32 h-6 bg-slate-800 rounded" />
              </div>
           </div>

           <div className="w-full max-w-2xl h-32 bg-slate-800/50 rounded-tr-[3rem] rounded-bl-[1rem] p-8" />

           <div className="flex gap-5 mt-8">
              <div className="w-48 h-16 bg-slate-800 rounded" />
              <div className="w-48 h-16 bg-slate-800 rounded" />
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[90vh] w-full overflow-hidden flex flex-col justify-center pb-40 px-6 md:px-12 pt-32 group">
      
      {/* --- CINEMATIC BACKGROUND --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div 
            className="absolute inset-0 w-full h-full transition-transform duration-300 ease-out" 
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
        <div className="flex items-center gap-3 mb-8">
            <span className="text-accent-gold font-bold tracking-[0.4em] text-[10px] md:text-xs uppercase border border-accent-gold/40 px-4 py-2 bg-black/80 rounded-sm backdrop-blur-xl shadow-2xl">
                Featured Discovery
            </span>
            <div className="w-8 h-[1px] bg-accent-gold/30"></div>
            <span className="text-slate-500 text-[10px] md:text-xs font-mono uppercase tracking-widest opacity-60">
                Latest Collection • Live Sync
            </span>
        </div>

        <h1 className="text-4xl md:text-7xl font-serif font-bold text-white mb-12 leading-tight tracking-tight drop-shadow-[0_20px_50px_rgba(0,0,0,1)] selection:bg-accent-gold selection:text-black max-w-5xl">
          {featuredBook.title}
        </h1>

        <div className="flex flex-wrap items-start gap-y-8 gap-x-12 md:gap-x-16 text-xs md:text-sm font-medium text-slate-300 mb-14 border-l-2 border-accent-gold/60 pl-6 ml-1">
            <div className="flex flex-col gap-1">
               <span className="text-emerald-500/90 font-bold tracking-[0.2em] uppercase text-[9px] mb-1">Atmospheric Weight</span>
               <span className="text-white font-serif italic text-xl md:text-2xl">Highly Compatible</span>
            </div>
            <div className="hidden lg:block h-12 w-[1px] bg-white/10 self-center"></div>
            <div className="flex flex-col gap-1">
               <span className="text-slate-500 font-bold tracking-[0.2em] uppercase text-[9px] mb-1">Created By</span>
               <span className="text-slate-100 font-serif italic text-xl md:text-2xl">{featuredBook.author}</span>
            </div>
            <div className="hidden lg:block h-12 w-[1px] bg-white/10 self-center"></div>
            <div className="flex flex-col gap-1">
               <span className="text-accent-gold font-bold tracking-[0.2em] uppercase text-[9px] mb-1">Curation Role</span>
               <span className="text-accent-gold font-serif italic text-xl md:text-2xl">{featuredBook.atmosphericRole || 'Global Sensation'}</span>
            </div>
        </div>

        <div className="relative mb-14 max-w-3xl">
           <div className="absolute -left-6 top-0 bottom-0 w-[2px] bg-gradient-to-b from-accent-gold via-accent-gold/40 to-transparent"></div>
           <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 p-8 rounded-tr-[3rem] rounded-bl-[1rem] shadow-2xl relative overflow-hidden group/desc">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold/5 blur-[120px] group-hover/desc:bg-accent-gold/10 transition-colors"></div>
              <p className="text-lg md:text-2xl text-slate-100 leading-relaxed font-serif italic font-light tracking-tight drop-shadow-md relative z-10">
                 <span className="text-accent-gold/40 text-4xl absolute -left-4 -top-4 font-serif leading-none">“</span>
                 {featuredBook.description}
                 <span className="text-accent-gold/40 text-4xl absolute -right-4 -bottom-8 font-serif leading-none">”</span>
              </p>
              <div className="mt-6 flex items-center gap-4">
                 <div className="flex gap-1.5">
                    {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent-gold opacity-30"></div>)}
                 </div>
                 <span className="text-[9px] uppercase font-bold tracking-[0.3em] text-slate-600">A.I. Synthesized Vibe</span>
              </div>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-5">
          <button 
            onClick={onStart} 
            className="px-10 py-5 rounded-sm bg-white text-black font-bold text-lg hover:bg-accent-gold transition-all flex items-center justify-center gap-3 shadow-[0_30px_60px_-15px_rgba(212,175,55,0.4)] group/btn relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
            <svg className="w-6 h-6 transform group-hover/btn:scale-125 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            Curate My Mood
          </button>
          
          <button 
            onClick={onBrowse} 
            className="px-10 py-5 rounded-sm bg-slate-900/40 text-white font-bold text-lg backdrop-blur-3xl border border-white/10 hover:border-accent-gold/50 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 group/browse"
          >
            Browse Genres
          </button>
          
          <button 
            onClick={() => onMoreInfo(featuredBook)} 
            className="px-6 py-5 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-3 group/info ml-auto md:ml-6"
          >
            Deep Archive
            <div className="w-8 h-[1px] bg-slate-700 group-hover:w-16 group-hover:bg-accent-gold transition-all"></div>
          </button>
        </div>
      </div>
    </div>
  );
};
