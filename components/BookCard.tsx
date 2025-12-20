
import React, { useState, useRef, useEffect } from 'react';
import { Book } from '../types';
import { generateAudioPreview } from '../services/gemini';
import { isInWishlist, toggleWishlist } from '../services/storage';
import { BookCover } from './BookCover';

interface BookCardProps {
  book: Book;
  index: number;
  onClick?: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, index, onClick }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    setIsSaved(isInWishlist(book));
    return () => {
      if (sourceNodeRef.current) sourceNodeRef.current.stop();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [book]);

  const handlePlayPreview = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    if (isPlaying) {
      if (sourceNodeRef.current) sourceNodeRef.current.stop();
      setIsPlaying(false);
      return;
    }

    setIsAudioLoading(true);
    try {
      const audioBuffer = await generateAudioPreview(`Here is a preview of ${book.title}. ${book.excerpt}`);
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      }
      const ctx = audioContextRef.current;
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
      sourceNodeRef.current = source;
      setIsPlaying(true);
    } catch (err: any) {
      setError(err.message || "Preview unavailable.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = toggleWishlist(book);
    setIsSaved(newState);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: book.title,
      text: `Discovery: "${book.title}" by ${book.author}`,
      url: book.buyLink || window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    try {
      const shareText = `${shareData.text} — ${shareData.url}`;
      await navigator.clipboard.writeText(shareText);
      setIsShared(true);
      setTimeout(() => setIsShared(false), 2000);
    } catch (err) {
      setError("Clipboard failed.");
      setTimeout(() => setError(null), 2000);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push(<svg key={i} className="w-2.5 h-2.5 text-accent-gold" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>);
      } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
        stars.push(
          <div key={i} className="relative w-2.5 h-2.5 text-slate-700">
            <svg className="absolute inset-0 text-slate-700" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${(rating % 1) * 100}%` }}>
              <svg className="w-2.5 h-2.5 text-accent-gold" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            </div>
          </div>
        );
      } else {
        stars.push(<svg key={i} className="w-2.5 h-2.5 text-slate-700" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>);
      }
    }
    return stars;
  };

  return (
    <div 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative w-full bg-black/40 hover:bg-black/80 backdrop-blur-md rounded-lg overflow-hidden shadow-2xl transition-all duration-500 flex flex-col border border-white/5 cursor-pointer h-full"
      style={{ 
        animationDelay: `${index * 100}ms`,
        transform: isHovered ? 'scale(1.02) translateY(-2px)' : 'scale(1) translateY(0)',
        borderColor: isHovered ? book.moodColor + '44' : 'rgba(255,255,255,0.05)',
        zIndex: isHovered ? 20 : 1
      }}
    >
      <div className="absolute top-0 left-0 w-full h-0.5 transition-opacity duration-300" style={{ backgroundColor: book.moodColor }} />
      
      <div className="p-4 flex flex-col h-full">
        <div className="mb-3 flex justify-between items-center gap-2">
          <span className="text-[9px] uppercase tracking-widest font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded truncate">
            {book.genre}
          </span>
          <div className="flex gap-2 shrink-0 relative z-20">
            <button
              onClick={handleShare}
              className={`flex items-center justify-center w-7 h-7 rounded-full border transition-all duration-300
                ${isShared 
                  ? 'bg-accent-gold border-accent-gold text-black' 
                  : 'border-white/10 text-slate-400 hover:border-white hover:text-white'}
              `}
              title={isShared ? "Copied to clipboard!" : "Copy link"}
            >
              {isShared ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              )}
            </button>

            <button
              onClick={handleToggleSave}
              className={`flex items-center justify-center w-7 h-7 rounded-full border transition-all duration-300
                ${isSaved 
                  ? 'bg-accent-gold border-accent-gold text-black' 
                  : 'border-white/10 text-slate-400 hover:border-white hover:text-white'}
              `}
            >
               <svg className="w-3.5 h-3.5" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
        </div>
        
        <div className="relative aspect-[2/3] w-full rounded shadow-lg bg-slate-900 overflow-hidden mb-4">
           <BookCover 
             isbn={book.isbn} 
             title={book.title} 
             author={book.author} 
             moodColor={book.moodColor}
             className="w-full h-full"
           />
           
           {error && (
             <div className="absolute inset-x-0 bottom-0 bg-red-600 text-[9px] text-white p-1.5 text-center animate-fade-in z-30 font-bold backdrop-blur-sm">
                {error}
             </div>
           )}

           <button 
             onClick={handlePlayPreview}
             disabled={isAudioLoading}
             className={`absolute bottom-2 right-2 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md shadow-xl border transition-all duration-300 z-20
               ${isAudioLoading 
                 ? 'bg-black/80 text-accent-gold border-accent-gold/50 cursor-wait'
                 : isPlaying 
                   ? 'bg-accent-gold text-black border-accent-gold' 
                   : 'bg-black/50 text-white border-white/20 hover:bg-white hover:text-black hover:border-white'}
             `}
           >
              {isAudioLoading ? (
                 <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z" /></svg>
              ) : (
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
           </button>
        </div>

        <div className="mt-auto">
           <h3 className="text-sm font-serif font-bold text-white mb-0.5 line-clamp-1 group-hover:text-accent-gold transition-colors">{book.title}</h3>
           <div className="flex items-center gap-2 overflow-hidden mb-1">
              <p className="text-[11px] text-slate-500 truncate">{book.author}</p>
              {book.language && (
                 <span className="shrink-0 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5 uppercase">
                   {book.language}
                 </span>
              )}
           </div>

           {(book.averageRating !== undefined || book.ratingsCount !== undefined) && (
              <div className="flex items-center gap-2">
                 {book.averageRating !== undefined && (
                    <div className="flex items-center">
                       {renderStars(book.averageRating)}
                       <span className="ml-1 text-[9px] font-mono text-accent-gold font-bold">{book.averageRating.toFixed(1)}</span>
                    </div>
                 )}
                 {book.ratingsCount !== undefined && (
                    <span className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">
                       ({book.ratingsCount.toLocaleString()} ratings)
                    </span>
                 )}
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
