
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
      setError(err.message || "Could not summon the audio preview.");
      setTimeout(() => setError(null), 4000);
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
      text: `Atmosphera Discovery: "${book.title}" by ${book.author}`,
      url: book.ebookUrl || window.location.href
    };

    // Try native share API first
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        console.debug("Native share cancelled or failed, falling back to clipboard.");
      }
    }

    // Fallback: Copy to clipboard
    try {
      const shareText = `${shareData.text}\nView at: ${shareData.url}`;
      await navigator.clipboard.writeText(shareText);
      setIsShared(true);
      setTimeout(() => setIsShared(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed", err);
      setError("Unable to copy link.");
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative w-full bg-black/60 hover:bg-black/90 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl transition-all duration-500 flex flex-col border border-white/10 cursor-pointer h-full"
      style={{ 
        animationDelay: `${index * 150}ms`,
        transform: isHovered ? 'scale(1.03) translateY(-4px)' : 'scale(1) translateY(0)',
        borderColor: isHovered ? book.moodColor : 'rgba(255,255,255,0.1)',
        boxShadow: isHovered ? `0 20px 50px -12px ${book.moodColor}40` : undefined,
        zIndex: isHovered ? 20 : 1
      }}
    >
      <div className="absolute top-0 left-0 w-full h-1 transition-opacity duration-300" style={{ backgroundColor: book.moodColor }} />
      
      {/* Intelligence Badges */}
      {book.reasoning && book.reasoning.length < 50 && (
          <div className="absolute top-3 left-3 z-30 pointer-events-none">
              <div className="bg-black/80 backdrop-blur-md border border-white/10 px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest text-accent-gold flex items-center gap-1.5 shadow-xl">
                  <div className="w-1 h-1 bg-accent-gold rounded-full animate-pulse"></div>
                  Neural Match
              </div>
          </div>
      )}

      <div className="p-5 flex flex-col h-full">
        <div className="mb-4 flex justify-between items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 bg-white/5 border border-white/10 px-2 py-1 rounded-full truncate max-w-[50%]">
            {book.genre}
          </span>
          <div className="flex gap-2 shrink-0 relative z-20">
            <button
              onClick={handleShare}
              className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300 bg-black/40
                ${isShared 
                  ? 'bg-accent-gold border-accent-gold text-black' 
                  : 'border-white/10 text-slate-400 hover:border-accent-gold hover:text-accent-gold'}
              `}
              title={isShared ? "Link copied to clipboard!" : "Copy link or share"}
            >
              {isShared ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              )}
            </button>

            <button
              onClick={handleToggleSave}
              className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300 bg-black/40
                ${isSaved 
                  ? 'bg-accent-gold/20 border-accent-gold text-accent-gold' 
                  : 'border-white/10 text-slate-400 hover:border-white hover:text-white'}
              `}
              title={isSaved ? "Saved to Archive" : "Save for later"}
            >
               {isSaved ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
               ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
               )}
            </button>
          </div>
        </div>
        
        <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden mb-4 shadow-lg bg-slate-800">
           <BookCover 
             isbn={book.isbn} 
             title={book.title} 
             author={book.author} 
             moodColor={book.moodColor}
             className="w-full h-full"
           />
           
           {error && (
             <div className="absolute inset-x-0 top-0 bg-red-500/90 text-[10px] text-white p-2 text-center animate-fade-in z-30 font-bold backdrop-blur-sm">
                {error}
             </div>
           )}

           <button 
             onClick={handlePlayPreview}
             disabled={isAudioLoading}
             className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-xl border transition-all duration-300 z-20
               ${isAudioLoading 
                 ? 'bg-black/80 text-accent-gold border-accent-gold/50 cursor-wait'
                 : isPlaying 
                   ? 'bg-accent-gold text-black border-accent-gold' 
                   : 'bg-black/40 text-white border-white/10 hover:bg-accent-gold hover:text-black hover:border-accent-gold'}
             `}
           >
              {isAudioLoading ? (
                 <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
              ) : isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z" /></svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
           </button>
        </div>

        <div className="mt-auto relative z-10">
           {book.reasoning && (
               <div className="mb-2">
                   <p className="text-[10px] text-accent-gold/80 italic font-serif leading-tight line-clamp-2">
                       {book.reasoning}
                   </p>
               </div>
           )}
           <h3 className="text-lg font-serif font-bold text-white mb-0.5 line-clamp-1 group-hover:text-accent-gold transition-colors">{book.title}</h3>
           <p className="text-xs text-slate-400 font-medium truncate">{book.author}</p>
        </div>
      </div>
    </div>
  );
};
