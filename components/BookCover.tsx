import React, { useState, useEffect } from 'react';
import { generateMoodImage } from '../services/gemini';

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
  const [isGenerated, setIsGenerated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);
    setSrc(null);
    setIsGenerated(false);

    const checkImage = (url: string): Promise<boolean> => {
      return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
              // OpenLibrary returns 1x1 pixel gif if not found with default=false
              if (img.naturalWidth > 1) resolve(true);
              else resolve(false);
          };
          img.onerror = () => resolve(false);
          img.src = url;
      });
    };

    const fetchCover = async () => {
      let foundUrl: string | null = null;

      // 1. Priority: OpenLibrary (High Resolution, relies on ISBN)
      if (isbn) {
        const cleanId = isbn.replace(/[^0-9X]/gi, '');
        const olUrl = `https://covers.openlibrary.org/b/isbn/${cleanId}-L.jpg?default=false`;
        if (await checkImage(olUrl)) {
          foundUrl = olUrl;
        }
      }

      // 2. Fallback: Google Books Search API (Title + Author)
      // This catches cases where ISBN is missing or OpenLibrary lacks the cover.
      if (!foundUrl) {
        try {
          // Search by title and author. 
          const query = `intitle:${encodeURIComponent(title)}`;
          const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`);
          if (res.ok) {
            const data = await res.json();
            const vol = data.items?.[0]?.volumeInfo;
            // Prefer thumbnail, replace http with https
            const thumb = vol?.imageLinks?.thumbnail || vol?.imageLinks?.smallThumbnail;
            if (thumb) {
              foundUrl = thumb.replace(/^http:\/\//i, 'https://');
            }
          }
        } catch (e) {
          console.warn("Cover fetch failed for", title);
        }
      }

      // 3. AI Generation Fallback (Gemini)
      // Generates a unique placeholder if external APIs fail
      if (!foundUrl) {
        try {
           const prompt = `A minimalist, artistic book cover design for the book "${title}" by ${author}. The mood color is ${moodColor}. No text overlays. abstract, atmospheric.`;
           foundUrl = await generateMoodImage(prompt);
           if (foundUrl) setIsGenerated(true);
        } catch (e) {
           console.warn("AI Cover generation failed", e);
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
  }, [isbn, title, author, moodColor]);

  // Fallback / Loading UI (Only shows if AI also fails or while loading)
  if (error || (!src && !loading)) {
    return (
      <div 
        className={`relative overflow-hidden flex flex-col justify-between p-6 ${className} group transition-all duration-500`} 
        style={{ 
          background: `linear-gradient(135deg, ${moodColor} 0%, #0f172a 120%)`,
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
        }}
      >
        {/* Artistic Elements for Fallback */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl transform translate-x-10 -translate-y-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/20 rounded-full blur-xl" />

        {/* Spine */}
        <div className="absolute left-3 top-0 bottom-0 w-[1px] bg-white/10" />

        {showText && (
          <div className="relative z-10 animate-fade-in flex flex-col h-full">
            <div className="mb-auto opacity-50">
               <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <div>
              <h3 className="font-serif font-bold text-white leading-tight text-xl drop-shadow-lg line-clamp-3 tracking-wide">
                {title}
              </h3>
              <p className="text-xs text-slate-300 mt-2 font-medium tracking-widest uppercase opacity-80 border-t border-white/20 pt-2 inline-block">
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
           {/* Ambient Background Glow */}
           <div 
             className="absolute inset-0 opacity-20 blur-3xl animate-pulse-slow"
             style={{ background: `radial-gradient(circle at center, ${moodColor}, transparent)` }}
           />
           
           {/* Abstract Floating Shapes */}
           <div className="absolute top-[-20%] right-[-20%] w-32 h-32 rounded-full bg-white/5 blur-2xl animate-[pulse_4s_ease-in-out_infinite]" />
           <div className="absolute bottom-[-20%] left-[-20%] w-32 h-32 rounded-full bg-white/5 blur-2xl animate-[pulse_5s_ease-in-out_infinite]" />

           {/* Central Loading Icon */}
           <div className="relative z-10 flex flex-col items-center gap-3">
             <div className="w-10 h-14 border border-white/10 rounded-sm bg-white/5 backdrop-blur-md flex items-center justify-center shadow-2xl relative overflow-hidden group">
                <div 
                   className="absolute inset-0 opacity-30 animate-[translate-x_2s_linear_infinite]"
                   style={{ background: `linear-gradient(90deg, transparent, ${moodColor}, transparent)` }}
                />
                <div className="w-[1px] h-10 bg-white/20" />
             </div>
             <div className="flex gap-1">
               <span className="w-1 h-1 rounded-full bg-white/40 animate-[bounce_1s_infinite]" style={{ animationDelay: '0ms' }} />
               <span className="w-1 h-1 rounded-full bg-white/40 animate-[bounce_1s_infinite]" style={{ animationDelay: '150ms' }} />
               <span className="w-1 h-1 rounded-full bg-white/40 animate-[bounce_1s_infinite]" style={{ animationDelay: '300ms' }} />
             </div>
           </div>
        </div>
      )}
      {src && (
        <>
          <img
            src={src}
            alt={title}
            className={`object-cover w-full h-full transition-all duration-700 ${loading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
          />
          {isGenerated && showText && (
             <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/90 via-black/20 to-transparent">
               <div className="border-t border-white/20 pt-2">
                 <h3 className="font-serif font-bold text-white text-lg leading-tight drop-shadow-lg line-clamp-3">{title}</h3>
                 <p className="text-xs text-slate-200 mt-1 uppercase tracking-widest font-medium opacity-90">{author}</p>
               </div>
             </div>
          )}
        </>
      )}
      {/* Cinematic overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
};