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
    <div className="relative h-[85vh] w-full overflow-hidden flex items-center pl-6 md:pl-12">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[#0f172a]">
        <div 
          className="absolute top-0 left-0 w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"
          style={{ transform: `translate(${offset.x * -0.5}px, ${offset.y * -0.5}px)` }}
        />
        <div 
          className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-purple-900/40 rounded-full blur-[120px]"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
        />
        <div 
          className="absolute bottom-[10%] left-[10%] w-[600px] h-[600px] bg-blue-900/30 rounded-full blur-[100px]"
          style={{ transform: `translate(${offset.x * 0.5}px, ${offset.y * 0.5}px)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/60 to-transparent" />
      </div>

      <div className="relative z-20 max-w-2xl animate-slide-up">
        <h1 className="text-6xl md:text-8xl font-serif font-bold text-white mb-6 leading-[0.9] drop-shadow-2xl">
          Stories matching <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-gold to-yellow-200">your soul.</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-lg leading-relaxed shadow-black drop-shadow-md">
          Forget algorithms based on sales. Atmosphera curates books based on the weather outside and the feeling inside.
        </p>
        <div className="flex gap-4">
          <Button onClick={onStart} className="px-8 py-4 text-lg bg-white text-black hover:bg-slate-200 border-none">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            Start Curating
          </Button>
          <Button onClick={onBrowse} variant="secondary" className="px-8 py-4 text-lg bg-white/20 backdrop-blur-md hover:bg-white/30">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Browse Collections
          </Button>
        </div>
      </div>
    </div>
  );
};