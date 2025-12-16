import React, { useState, useRef, useEffect } from 'react';
import { Book, WebSource } from '../types';
import { generateAudioPreview, fetchBookDetails } from '../services/gemini';
import { isInWishlist, toggleWishlist } from '../services/storage';
import { MoodVisualizer } from './MoodVisualizer';
import { BookCover } from './BookCover';

interface BookCardProps {
  book: Book;
  index: number;
}

export const BookCard: React.FC<BookCardProps> = ({ book, index }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [details, setDetails] = useState<{ summary: string, sources: WebSource[] } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isShared, setIsShared] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Check initial saved state
    setIsSaved(isInWishlist(book));

    return () => {
      if (sourceNodeRef.current) sourceNodeRef.current.stop();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [book]);

  const handlePlayPreview = async () => {
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
    } catch (error) {
      alert("Could not generate audio preview.");
    } finally {
      setIsAudioLoading(false);
    }
  };

  const loadRealTimeInfo = async () => {
    if (details) return;
    setLoadingDetails(true);
    const info = await fetchBookDetails(book.title, book.author);
    setDetails(info);
    setLoadingDetails(false);
  };

  const handleToggleSave = () => {
    const newState = toggleWishlist(book);
    setIsSaved(newState);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: book.title,
      text: `Check out "${book.title}" by ${book.author} on Atmosphera. ${book.description}`,
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
      className="group relative w-full bg-black/60 backdrop-blur-xl rounded-xl overflow-hidden shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-accent-gold/20 flex flex-col border border-white/10"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: book.moodColor }} />
      
      <div className="p-6 md:p-8 flex flex-col h-full">
        <div className="mb-6 flex justify-between items-start">
          <span className="text-xs uppercase tracking-widest font-bold text-accent-gold bg-accent-gold/10 border border-accent-gold/20 px-3 py-1 rounded-full backdrop-blur-md mt-1">
            {book.genre}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300 bg-black/20
                ${isShared 
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' 
                  : 'border-slate-600 text-slate-400 hover:border-blue-400 hover:text-blue-400'}
              `}
              title={isShared ? "Copied!" : "Share"}
            >
              {isShared ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              )}
            </button>

            {/* E-Book Button */}
            {book.ebookUrl && (
              <a 
                href={book.ebookUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-600 transition-all duration-300 hover:border-accent-gold hover:text-accent-gold text-slate-400 bg-black/20"
                title="Get E-Book"
              >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </a>
            )}

            <button
              onClick={handleToggleSave}
              className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300 bg-black/20
                ${isSaved 
                  ? 'bg-red-500/20 border-red-500 text-red-500' 
                  : 'border-slate-600 text-slate-400 hover:border-red-400 hover:text-red-400'}
              `}
              title={isSaved ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <svg className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button 
              onClick={handlePlayPreview}
              disabled={isAudioLoading}
              className={`flex items-center justify-center w-10 h-10 rounded-full border border-slate-600 transition-all duration-300 bg-black/20
                ${isPlaying ? 'bg-accent-gold border-accent-gold text-deep-bg' : 'hover:border-accent-gold hover:text-accent-gold text-slate-400'}
              `}
            >
               {isAudioLoading ? (
                 <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               ) : isPlaying ? (
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
               ) : (
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
               )}
            </button>
          </div>
        </div>

        {/* Content Row: Cover & Info */}
        <div className="flex gap-6 mb-6">
            <div className="w-24 md:w-32 aspect-[2/3] shrink-0 rounded-lg overflow-hidden shadow-lg border border-slate-700">
                <BookCover 
                    isbn={book.isbn} 
                    title={book.title} 
                    author={book.author} 
                    moodColor={book.moodColor}
                    showText={false}
                />
            </div>
            <div>
                <h3 className="text-2xl font-serif font-bold text-white mb-2 group-hover:text-accent-gold transition-colors leading-tight">
                {book.title}
                </h3>
                <p className="text-sm font-medium text-slate-400 italic flex flex-wrap items-center gap-2">
                  <span>by {book.author}</span>
                  {book.language && (
                     <span className="not-italic text-[10px] uppercase tracking-wider text-slate-500 border border-slate-700 px-2 py-0.5 rounded-full bg-black/20">
                       {book.language}
                     </span>
                  )}
                </p>
            </div>
        </div>

        <div className="bg-white/5 p-4 rounded-lg mb-6 border-l-2 border-slate-700">
           <p className="text-slate-300 text-sm leading-relaxed">"{book.description}"</p>
        </div>

        {/* Dynamic Image Visualizer */}
        <div className="mb-6">
          <MoodVisualizer initialPrompt={`A scene from the book ${book.title} by ${book.author}. Atmosphere: ${book.reasoning}`} />
        </div>

        <div className="mt-auto space-y-4">
          {/* Grounding / Real-time Info */}
          <div className="border-t border-white/10 pt-4">
            {!details ? (
              <button onClick={loadRealTimeInfo} className="text-xs text-accent-gold hover:underline flex items-center gap-1">
                 {loadingDetails ? 'Searching Google...' : 'Fetch Live Insights & Reviews'}
                 {!loadingDetails && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
              </button>
            ) : (
              <div className="text-xs text-slate-400 bg-black/40 p-3 rounded animate-fade-in">
                <p className="mb-2 italic">{details.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {details.sources.map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="text-accent-gold hover:text-white border border-slate-700 px-2 py-1 rounded-full transition-colors truncate max-w-[150px]">
                      {s.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-start gap-3 pt-2">
             <div className="mt-1 min-w-[20px]">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent-gold" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
               </svg>
             </div>
             <p className="text-sm text-slate-300 leading-relaxed">
               <span className="font-semibold text-accent-gold">Why it fits:</span> {book.reasoning}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
