import React, { useState, useEffect } from 'react';

interface BookCoverProps {
  isbn?: string;
  title: string;
  author: string;
  moodColor: string;
  className?: string;
  showText?: boolean;
}

export const BookCover: React.FC<BookCoverProps> = ({ 
  isbn, 
  title, 
  author, 
  moodColor, 
  className = '',
  showText = true
}) => {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper to clean ISBN
  const cleanIsbn = (id: string) => id.replace(/[^0-9X]/gi, '');

  useEffect(() => {
    if (!isbn) {
      setError(true);
      setLoading(false);
      return;
    }
    const cleanId = cleanIsbn(isbn);
    // Priority 1: Open Library (High Quality)
    setSrc(`https://covers.openlibrary.org/b/isbn/${cleanId}-L.jpg?default=false`); 
    setError(false);
    setLoading(true);
  }, [isbn]);

  const handleError = () => {
    // If Open Library fails, we switch directly to the aesthetic fallback.
    // We avoid Google Books API as it often returns ugly "Image Not Available" placeholders.
    setError(true);
    setLoading(false);
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // Check for 1x1 pixel tracking images which indicate failure
    if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
      handleError();
      return;
    }
    setLoading(false);
  };

  if (error || !isbn) {
    return (
      <div 
        className={`relative overflow-hidden flex flex-col justify-between p-6 ${className} group transition-all duration-500`} 
        style={{ 
          backgroundColor: moodColor,
          boxShadow: 'inset 4px 0 10px rgba(0,0,0,0.2)' // Spine shadow effect
        }}
      >
        {/* Texture & Lighting Effects */}
        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-white/10" />
        
        {/* Book Spine Detail */}
        <div className="absolute left-2 top-0 bottom-0 w-[2px] bg-black/20" />
        <div className="absolute left-1 top-0 bottom-0 w-[1px] bg-white/20" />

        {/* Minimalist Header (optional decoration) */}
        <div className="relative z-10 w-full flex justify-end">
           <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center opacity-50">
             <span className="text-[8px] text-white font-serif">A</span>
           </div>
        </div>

        {showText && (
          <div className="relative z-10 animate-fade-in border-t border-white/20 pt-4 mt-auto">
            <h3 className="font-serif font-bold text-white leading-[1.1] text-xl md:text-2xl drop-shadow-lg line-clamp-4 tracking-wide">
              {title}
            </h3>
            <p className="text-xs md:text-sm text-slate-200 mt-3 font-medium tracking-widest uppercase opacity-90">
              {author}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative bg-slate-800 ${className} overflow-hidden shadow-2xl`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 z-10">
          <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <img
        src={src!}
        alt={title}
        className={`object-cover w-full h-full transition-all duration-700 ${loading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
        onError={handleError}
        onLoad={handleLoad}
      />
      {/* Subtle overlay gradient for better text readability on hover cards */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};