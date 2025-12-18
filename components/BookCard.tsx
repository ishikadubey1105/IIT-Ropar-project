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
      text: `Check out "${book.title}" by ${book.author} on Atmosphera.`,
      url: book.ebookUrl || window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.debug("Share cancelled");
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
      } catch (err) {
        console.error("Clipboard failed", err);
      }
    }
  };

  return (
    <div 
      onClick={onClick}
      className="group relative w-full bg-black/60 backdrop-blur-xl rounded-xl overflow-hidden shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-accent-gold/20 flex flex-col border border-white/10 cursor-pointer h-full"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: book.moodColor }} />
      
      <div className="p-5 flex flex-col h-full">
        <div className="mb-4 flex justify-between items-start gap-2">
          <span className="text-[10px] uppercase tracking-widest font-bold text-accent-gold bg-accent-gold/10 border border-accent-gold/20 px-2 py-1 rounded-full backdrop-blur-md mt-1 truncate max-w-[50%]">
            {book.genre}
          </span>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleShare}
              className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300 bg-black/20
                ${isShared 
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' 
                  : 'border-slate-600 text-slate-400 hover:border-blue-400 hover:text-blue-400'}
              `}
              title={isShared ? "Copied to clipboard" : "Share this book"}
            >
              {isShared ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              )}
            </button>

            {book.ebookUrl && (
              <a 
                href={book.ebookUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-600 transition-all duration-300 hover:border-accent-gold hover:text-accent-gold text-slate-400 bg-black/20"
                title="Read E-Book"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </a>
            )}

            <button
              onClick={handleToggleSave}
              className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300 bg-black/20
                ${isSaved 
                  ? 'bg-red-500/20 border-red-500 text-red-500' 
                  : 'border-slate-600 text-slate-400 hover:border-white hover:text-white'}
              `}
              title={isSaved ? "Remove from My List" : "Add to My List"}
            >
               {isSaved ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
               ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
               )}
            </button>
          </div>
        </div>
        
        <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden mb-4 shadow-lg group-hover:shadow-accent-gold/10 transition-shadow bg-slate-800">
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
             title={isAudioLoading ? "Generating Audio Preview..." : isPlaying ? "Stop Preview" : "Listen to Preview"}
             className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-xl border transition-all duration-300 z-20
               ${isAudioLoading 
                 ? 'bg-black/80 text-accent-gold border-accent-gold/50 cursor-wait scale-100'
                 : isPlaying 
                   ? 'bg-accent-gold text-black border-accent-gold' 
                   : 'bg-black/40 text-white border-white/20 hover:bg-accent-gold hover:text-black hover:border-accent-gold hover:scale-110'}
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

        <div className="mt-auto">
           <h3 className="text-xl font-serif font-bold text-white mb-1 line-clamp-1 leading-tight group-hover:text-accent-gold transition-colors">{book.title}</h3>
           <p className="text-sm text-slate-400 font-medium">{book.author}</p>
           {book.publisher && (
             <p className="text-[9px] text-slate-500 mt-1 opacity-60 uppercase tracking-tighter truncate font-sans">
               {book.publisher}
             </p>
           )}
        </div>
      </div>
    </div>
  );
};