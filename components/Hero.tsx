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

  const showcaseBooks = [
    { id: '1', title: 'The Great Gatsby', img: 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg', style: 'rotate-[-6deg] translate-y-4' },
    { id: '2', title: 'Dune', img: 'https://covers.openlibrary.org/b/isbn/9780441013593-L.jpg', style: 'rotate-[6deg] z-20 scale-110 shadow-2xl' },
    { id: '3', title: '1984', img: 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg', style: 'rotate-[-3deg] translate-x-4 translate-y-8' }
  ];

  return (
    <div className="relative min-h-[85vh] w-full overflow-hidden flex flex-col md:flex-row items-center px-6 md:px-12 pt-24 md:pt-0">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[#0f172a] -z-10">
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
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/80 to-transparent" />
      </div>

      <div className="relative z-20 max-w-2xl w-full animate-slide-up md:w-1/2">
        <h1 className="text-5xl md:text-8xl font-serif font-bold text-white mb-6 leading-[0.9] drop-shadow-2xl">
          Stories matching <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-gold to-yellow-200">your soul.</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-lg leading-relaxed shadow-black drop-shadow-md">
          Forget algorithms based on sales. Atmosphera curates books based on the weather outside and the feeling inside.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
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

      {/* Floating Book Gallery - New Visual Element */}
      <div className="relative w-full md:w-1/2 h-[50vh] md:h-full flex items-center justify-center pointer-events-none mt-12 md:mt-0">
         <div className="relative w-full max-w-md h-96">
            {showcaseBooks.map((book, i) => (
               <div 
                 key={book.id}
                 className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 md:w-56 aspect-[2/3] rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden bg-slate-800 transition-transform duration-1000 ease-out animate-pulse-slow ${book.style}`}
                 style={{ 
                    transform: `translate(calc(-50% + ${offset.x * (i + 1)}px), calc(-50% + ${offset.y * (i + 1)}px)) ${book.style.split(' ').filter(s => s.startsWith('rotate')).join(' ')}` 
                 }}
               >
                 <img src={book.img} alt={book.title} className="w-full h-full object-cover opacity-90 hover:opacity-100" />
                 <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent"></div>
               </div>
            ))}
            
            {/* Floating Particles/Elements */}
            <div className="absolute top-0 right-0 w-24 h-24 border-2 border-accent-gold/20 rounded-full animate-spin-slow"></div>
            <div className="absolute bottom-10 left-10 w-4 h-4 bg-accent-gold rounded-full blur-[2px] animate-pulse"></div>
         </div>
      </div>
    </div>
  );
};