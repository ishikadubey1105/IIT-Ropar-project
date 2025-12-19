
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

const LoadingPlaceholder = ({ moodColor }: { moodColor: string }) => {
  return (
    <div className="absolute inset-0 z-20 bg-[#0a0a0c] flex items-center justify-center overflow-hidden">
      {/* Ambient Mood Glow */}
      <div 
        className="absolute inset-0 opacity-30 blur-[60px] transition-all duration-1000 animate-pulse-slow"
        style={{ 
          background: `radial-gradient(circle at center, ${moodColor}, transparent 70%)` 
        }} 
      />
      
      {/* Subtle Grid Texture */}
      <div 
        className="absolute inset-0 opacity-[0.07]" 
        style={{ 
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} 
      />

      {/* Central Loader Mechanism */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        {/* Outer Ring */}
        <div className="absolute inset-0 border border-white/10 rounded-full animate-[spin_10s_linear_infinite]" />
        
        {/* Inner Moving Arcs */}
        <div 
            className="absolute inset-0 border-t border-l border-white/40 rounded-full animate-[spin_3s_linear_infinite]"
            style={{ borderColor: `${moodColor}80 transparent transparent transparent` }}
        />
        <div 
            className="absolute inset-4 border-b border-r border-white/20 rounded-full animate-[spin_2s_linear_infinite_reverse]" 
        />
        
        {/* Core Pulse */}
        <div className="w-1.5 h-1.5 bg-white/80 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-pulse" />
      </div>
      
      {/* Scanning Line */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent animate-slide-up pointer-events-none" />

      {/* Status Text */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
         <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/30 animate-pulse">
            Syncing Archive
         </span>
      </div>
    </div>
  );
};

// Visual generator for covers when image is missing
const GeneratedPlaceholder = ({ title, author, moodColor, showText, isError }: { title: string, author: string, moodColor: string, showText: boolean, isError?: boolean }) => {
  // Deterministic variants based on title
  const seed = title.charCodeAt(0) + (author?.length || 0);
  const variant = seed % 4;

  return (
    <div 
      className="absolute inset-0 flex flex-col justify-between p-4 bg-slate-900 transition-all duration-700 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${moodColor}CC 0%, #0f172a 100%)`
      }}
    >
      {/* Texture Layer */}
      <div 
        className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
        }}
      />

      {/* Error Specific Texture: Diagonal Scanlines */}
      {isError && (
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 11px)' }} 
        />
      )}
      
      {/* Dynamic Geometric Elements based on variant */}
      {variant === 0 && (
        <>
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full border-[1px] border-white/10 opacity-50" />
            <div className="absolute top-20 -left-5 w-24 h-24 bg-white/5 blur-2xl rounded-full" />
            <div className="absolute bottom-10 right-10 w-12 h-12 border border-white/20 rotate-45" />
        </>
      )}
      {variant === 1 && (
        <>
            <div className="absolute inset-0 opacity-30 mix-blend-soft-light" style={{ backgroundImage: `radial-gradient(circle at 80% 20%, ${moodColor}, transparent 60%)` }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-white/5 rounded-full scale-150 opacity-20" />
        </>
      )}
      {variant === 2 && (
        <div className="absolute inset-4 border border-white/10 flex items-center justify-center">
            <div className="w-[1px] h-full bg-white/5 absolute" />
            <div className="h-[1px] w-full bg-white/5 absolute" />
        </div>
      )}
      {variant === 3 && (
        <>
           <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-xl" />
           <div className="absolute top-4 right-4 text-[4rem] font-serif leading-none opacity-5 select-none">{title.charAt(0)}</div>
        </>
      )}

      {/* Typography Layer */}
      {showText && (
        <div className="relative z-10 flex flex-col h-full justify-between animate-fade-in">
           {/* Top branding seal */}
           <div className="flex justify-between items-start opacity-60">
              <div className="w-6 h-[1px] bg-white/50 mt-1.5"></div>
              <div className={`text-[8px] font-mono tracking-[0.2em] uppercase ${isError ? 'text-red-300/80' : 'text-white/80'}`}>
                {isError ? 'ARCHIVE RECONSTRUCTION' : 'ATMOSPHERA'}
              </div>
           </div>

           <div className="mt-auto pb-2">
              <h3 
                className="font-serif font-bold text-white leading-[1.05] drop-shadow-lg tracking-wide mb-3 line-clamp-4"
                style={{ 
                    fontSize: title.length > 20 ? '1.25rem' : '1.5rem',
                    textShadow: '0 4px 20px rgba(0,0,0,0.5)' 
                }}
              >
                {title}
              </h3>
              
              <div className={`w-8 h-0.5 mb-3 rounded-full ${isError ? 'bg-white/20' : 'bg-accent-gold/80'}`} />
              
              <p className="text-[10px] text-slate-200 font-medium tracking-[0.15em] uppercase opacity-90 line-clamp-1">
                {author}
              </p>
           </div>
        </div>
      )}

      {/* Error/Reconstruction specific glitch accent */}
      {isError && (
        <div className="absolute top-0 right-0 p-2 opacity-50">
             <div className="flex gap-1">
                <div className="w-1 h-1 bg-white/40 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-white/40 rounded-full animate-pulse delay-75"></div>
                <div className="w-1 h-1 bg-white/40 rounded-full animate-pulse delay-150"></div>
             </div>
        </div>
      )}
    </div>
  );
};

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
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(!coverUrl);

  useEffect(() => {
    if (coverUrl) {
        setSrc(coverUrl);
        setLoading(false);
        setHasError(false);
        return;
    }

    let isMounted = true;
    setLoading(true);
    setHasError(false);
    setSrc(null);

    const checkImage = (url: string): Promise<boolean> => {
      return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img.naturalWidth > 1);
          img.onerror = () => resolve(false);
          img.src = url;
      });
    };

    const fetchCover = async () => {
      let foundUrl: string | null = null;
      
      // 1. Try OpenLibrary via ISBN
      if (isbn) {
        const cleanId = isbn.replace(/[^0-9X]/gi, '');
        const olUrl = `https://covers.openlibrary.org/b/isbn/${cleanId}-L.jpg?default=false`;
        if (await checkImage(olUrl)) {
          foundUrl = olUrl;
        }
      }

      // 2. Try Google Books API via Title/Author
      if (!foundUrl) {
        try {
          const query = `intitle:${encodeURIComponent(title)} ${author ? `inauthor:${encodeURIComponent(author)}` : ''}`;
          const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`);
          if (res.ok) {
            const data = await res.json();
            const vol = data.items?.[0]?.volumeInfo;
            const thumb = vol?.imageLinks?.thumbnail || vol?.imageLinks?.smallThumbnail;
            if (thumb) {
              const secureThumb = thumb.replace(/^http:\/\//i, 'https://');
              if (await checkImage(secureThumb)) {
                 foundUrl = secureThumb;
              }
            }
          }
        } catch (e) {
            // silent fail
        }
      }

      if (isMounted) {
        if (foundUrl) {
          setSrc(foundUrl);
        } else {
          setHasError(true);
        }
        setLoading(false);
      }
    };

    fetchCover();
    return () => { isMounted = false; };
  }, [isbn, title, author, coverUrl]);

  return (
    <div className={`relative bg-slate-900 ${className} overflow-hidden shadow-2xl group`}>
      {loading && <LoadingPlaceholder moodColor={moodColor} />}

      {!loading && src && !hasError ? (
        <img
          src={src}
          alt={title}
          onError={() => setHasError(true)}
          className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
        />
      ) : !loading ? (
        <GeneratedPlaceholder 
            title={title} 
            author={author} 
            moodColor={moodColor} 
            showText={showText} 
            isError={hasError}
        />
      ) : null}
      
      {/* Shine effect overlay for all covers */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
    </div>
  );
};
