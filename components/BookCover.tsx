import React, { useState, useEffect, useMemo } from 'react';

interface BookCoverProps {
  isbn?: string;
  title: string;
  author: string;
  moodColor: string;
  className?: string;
  showText?: boolean;
  coverUrl?: string;
}

// --- Procedural Art Components ---

const TextureOverlay = () => (
  <div 
    className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
    style={{ 
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
    }}
  />
);

const PatternGeometric = ({ color }: { color: string }) => (
  <>
    <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full border-[20px] border-white/5 opacity-50" />
    <div className="absolute top-20 -left-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
    <div className="absolute bottom-10 right-4 w-16 h-16 border border-white/20 rotate-45" />
    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-30" />
  </>
);

const PatternOrganic = ({ color }: { color: string }) => (
  <>
    <div className="absolute inset-0 opacity-40 mix-blend-multiply" style={{ backgroundImage: `radial-gradient(circle at 70% 20%, ${color}, transparent 60%)` }} />
    <svg className="absolute bottom-[-10%] left-[-10%] w-[120%] h-64 opacity-10 text-white transform rotate-3" viewBox="0 0 100 100" preserveAspectRatio="none">
       <path d="M0 100 C 30 20 70 20 100 100 Z" fill="currentColor" />
    </svg>
    <div className="absolute top-1/4 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
  </>
);

const PatternMinimal = ({ title }: { title: string }) => (
  <>
     <div className="absolute -top-6 -right-6 text-[10rem] font-serif opacity-5 font-bold leading-none select-none overflow-hidden text-white" style={{ fontFamily: '"Times New Roman", serif' }}>
       {title.charAt(0)}
     </div>
     <div className="absolute inset-4 border border-white/10" />
     <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
  </>
);

const PatternAbstract = ({ color }: { color: string }) => (
    <>
       <div className="absolute inset-0 opacity-10" style={{ 
           backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)' 
       }} />
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-white/10 rounded-full" />
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/5 rotate-45" />
    </>
);

export const BookCover: React.FC<BookCoverProps> = ({ 
  isbn, 
  title, 
  author, 
  moodColor, 
  className = '',
  showText = true,
  coverUrl
}) => {
  const [src, setSrc] = useState<string | null>(coverUrl || null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(!coverUrl);

  // Deterministically choose a style based on the title string
  const styleVariant = useMemo(() => {
    const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return hash % 4; // 0: Geometric, 1: Organic, 2: Minimal, 3: Abstract
  }, [title]);

  useEffect(() => {
    if (coverUrl) {
        setSrc(coverUrl);
        setLoading(false);
        setError(false);
        return;
    }

    let isMounted = true;
    setLoading(true);
    setError(false);
    setSrc(null);

    const checkImage = (url: string): Promise<boolean> => {
      return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
              if (img.naturalWidth > 1) resolve(true);
              else resolve(false);
          };
          img.onerror = () => resolve(false);
          img.src = url;
      });
    };

    const fetchCover = async () => {
      let foundUrl: string | null = null;

      // 1. Priority: OpenLibrary
      if (isbn) {
        const cleanId = isbn.replace(/[^0-9X]/gi, '');
        const olUrl = `https://covers.openlibrary.org/b/isbn/${cleanId}-L.jpg?default=false`;
        if (await checkImage(olUrl)) {
          foundUrl = olUrl;
        }
      }

      // 2. Fallback: Google Books Search
      if (!foundUrl) {
        try {
          const query = `intitle:${encodeURIComponent(title)} ${author ? `inauthor:${encodeURIComponent(author)}` : ''}`;
          const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`);
          if (res.ok) {
            const data = await res.json();
            const vol = data.items?.[0]?.volumeInfo;
            const thumb = vol?.imageLinks?.thumbnail || vol?.imageLinks?.smallThumbnail;
            if (thumb) {
              foundUrl = thumb.replace(/^http:\/\//i, 'https://');
            }
          }
        } catch (e) {
          console.warn("Cover fetch failed for", title);
        }
      }

      if (isMounted) {
        if (foundUrl) {
          setSrc(foundUrl);
          setError(false);
        } else {
          setError(true);
        }
        setLoading(false);
      }
    };

    fetchCover();
    return () => { isMounted = false; };
  }, [isbn, title, author, coverUrl]);

  // Fallback UI (Procedural Art)
  if (error || (!src && !loading)) {
    return (
      <div 
        className={`relative overflow-hidden flex flex-col justify-end p-6 ${className} group transition-all duration-500 bg-slate-900`} 
        style={{ 
          background: `linear-gradient(135deg, ${moodColor}dd 0%, #0f172a 100%)`,
          boxShadow: 'inset 2px 0 5px rgba(255,255,255,0.05), inset -2px 0 10px rgba(0,0,0,0.5)'
        }}
      >
        <TextureOverlay />
        
        {/* Book Spine Shadow Effect */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-white/10 to-transparent z-10" />
        <div className="absolute left-3 top-0 bottom-0 w-[1px] bg-black/20 z-10" />

        {/* Render Procedural Pattern */}
        {styleVariant === 0 && <PatternGeometric color={moodColor} />}
        {styleVariant === 1 && <PatternOrganic color={moodColor} />}
        {styleVariant === 2 && <PatternMinimal title={title} />}
        {styleVariant === 3 && <PatternAbstract color={moodColor} />}

        {showText && (
          <div className="relative z-20 animate-fade-in flex flex-col h-full justify-between pointer-events-none">
            {/* Top Decoration */}
            <div className="flex justify-between items-start opacity-70">
                <div className="w-8 h-[1px] bg-white/50"></div>
                <div className="text-[9px] font-mono tracking-[0.2em] uppercase text-white/80">Atmosphera</div>
            </div>

            <div className="mt-auto">
              <h3 
                className="font-serif font-bold text-white leading-[1.1] text-xl md:text-2xl drop-shadow-xl line-clamp-4 tracking-wide mb-3"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
              >
                {title}
              </h3>
              <div className="w-12 h-0.5 bg-accent-gold/90 mb-3 rounded-full"></div>
              <p className="text-xs text-slate-100 font-medium tracking-[0.15em] uppercase opacity-90 line-clamp-1 text-shadow-sm">
                {author}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative bg-slate-800 ${className} overflow-hidden shadow-2xl`}>
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden bg-slate-900">
           <div 
             className="absolute inset-0 opacity-20 blur-3xl animate-pulse-slow"
             style={{ background: `radial-gradient(circle at center, ${moodColor}, transparent)` }}
           />
           <div className="relative z-10 flex flex-col items-center gap-3">
             <div className="w-8 h-12 border border-white/10 rounded-sm bg-white/5 backdrop-blur-md flex items-center justify-center shadow-2xl">
                <div className="w-[1px] h-8 bg-white/20" />
             </div>
           </div>
        </div>
      )}
      {src && (
        <img
          src={src}
          alt={title}
          className={`object-cover w-full h-full transition-all duration-700 ${loading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
        />
      )}
      {/* Subtle overlay to ensure text contrast if text is ever overlaid */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
};