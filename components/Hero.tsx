import React, { useEffect, useState } from 'react';
import { Button } from './Button';

interface HeroProps {
  onStart: () => void;
  onBrowse: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStart, onBrowse }) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setOffset({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center px-6 md:px-12">
      {/* Content */}
      <div 
        className="relative z-20 max-w-4xl w-full text-center flex flex-col items-center animate-slide-up"
        style={{ transform: `translate(${offset.x * 0.2}px, ${offset.y * 0.2}px)` }}
      >
        <h1 className="text-5xl md:text-8xl font-serif font-bold text-white mb-6 leading-[0.9] drop-shadow-2xl">
          Stories matching <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-gold to-yellow-200">your soul.</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-200 mb-10 max-w-2xl leading-relaxed shadow-black drop-shadow-lg mx-auto font-light">
          Forget algorithms based on sales. Atmosphera curates books based on the weather outside and the feeling inside.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
          <Button onClick={onStart} className="px-8 py-4 text-lg bg-white text-black hover:bg-slate-200 border-none shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            Start Curating
          </Button>
          <Button onClick={onBrowse} variant="secondary" className="px-8 py-4 text-lg bg-white/5 backdrop-blur-md hover:bg-white/10 border border-white/20">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Browse Collections
          </Button>
        </div>
      </div>

      {/* Downward Scroll Indicator */}
      <div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 cursor-pointer flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity"
        onClick={onBrowse}
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-300 font-medium">Discover</span>
        <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center animate-bounce bg-black/20 backdrop-blur-sm">
           <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
        </div>
      </div>
    </div>
  );
};