
import React, { useEffect, useState, useRef } from 'react';
import { Book } from '../types';


interface HeroProps {
  onStart: () => void;
  onBrowse: () => void;
  featuredBook: Book | null;
  featuredBooks?: Book[]; // New prop for carousel
  onMoreInfo: (book: Book) => void;
  isLoading?: boolean;
}

export const Hero: React.FC<HeroProps> = ({ onStart, onBrowse, featuredBook, featuredBooks = [], onMoreInfo, isLoading }) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const rafRef = useRef<number | null>(null);

  // Combine single featuredBook with specific array if provided, or just use what we have
  const books = React.useMemo(() => {
    if (featuredBooks.length > 0) return featuredBooks;
    if (featuredBook) return [featuredBook];
    return [];
  }, [featuredBook, featuredBooks]);

  const currentBook = books[currentIndex] || null;

  useEffect(() => {
    if (books.length > 1) {
      const interval = setInterval(() => {
        nextSlide();
      }, 4000); // Auto slide every 4s
      return () => clearInterval(interval);
    }
  }, [currentIndex, books.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % books.length);
  };

  useEffect(() => {
    setIsVisible(true);

    const handleMove = (e: MouseEvent) => {
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        setOffset({
          x: (e.clientX / window.innerWidth - 0.5) * 10,
          y: (e.clientY / window.innerHeight - 0.5) * 10
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

  if (isLoading || !currentBook) {
    return (
      <div className="relative min-h-[80vh] w-full flex flex-col justify-center px-6 md:px-12 pt-32 overflow-hidden bg-[#0a0a0c]">
        <div className="animate-pulse space-y-6 max-w-4xl">
          <div className="w-32 h-4 bg-slate-800 rounded-full" />
          <div className="w-3/4 h-16 bg-slate-800 rounded-lg" />
          <div className="w-1/2 h-8 bg-slate-800 rounded-lg" />
          <div className="w-full h-24 bg-slate-800/50 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[85vh] w-full overflow-hidden flex flex-col justify-center pb-24 px-6 md:px-12 pt-32 group">

      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 w-full h-full transition-transform duration-500 ease-out"
          style={{ transform: `translate(${offset.x * -1}px, ${offset.y * -1}px) scale(1.05)` }}
        >
          <div className="w-full h-full animate-ken-burns">
            {currentBook.coverUrl ? (
              <img
                src={currentBook.coverUrl}
                alt=""
                className="w-full h-full object-cover blur-[12px] opacity-40 md:opacity-50 saturate-[0.8]"
              />
            ) : (
              <div className="w-full h-full" style={{ backgroundColor: currentBook.moodColor, opacity: 0.2 }} />
            )}
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      <div className={`relative z-20 max-w-5xl w-full transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-accent-gold font-bold tracking-[0.3em] text-[10px] uppercase border border-accent-gold/30 px-3 py-1 bg-black/60 rounded backdrop-blur-md">
            Featured Selection
          </span>
        </div>

        <h1 className="text-5xl md:text-8xl font-serif font-bold text-white mb-4 leading-[0.9] tracking-tighter drop-shadow-2xl animate-fade-in key={currentBook.title}">
          {currentBook.title}
        </h1>

        <p className="text-xl md:text-2xl text-slate-400 font-serif italic mb-10 pl-1 animate-fade-in duration-700">
          {currentBook.author}
        </p>

        <div className="relative mb-12 max-w-2xl">
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 p-6 md:p-8 rounded-lg shadow-2xl">
            <p className="text-lg md:text-xl text-slate-200 leading-relaxed font-serif italic font-light line-clamp-3">
              "{currentBook.description}"
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={onStart}
            className="px-10 py-4 rounded bg-white text-black font-bold text-base hover:bg-accent-gold transition-all shadow-xl group/btn overflow-hidden relative"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              Curate My Mood
            </span>
          </button>

          <button
            onClick={() => onMoreInfo(currentBook)}
            className="px-8 py-4 rounded bg-slate-900/60 text-white font-bold text-base backdrop-blur-xl border border-white/10 hover:border-white/30 transition-all"
          >
            Details
          </button>
        </div>

        {/* Carousel Indicators - Kept minimalistic, removed arrows as requested */}
        {books.length > 1 && (
          <div className="flex gap-2 mt-12">
            {books.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-accent-gold' : 'w-2 bg-white/20 hover:bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
