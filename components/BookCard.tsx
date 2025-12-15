import React, { useState, useRef, useEffect } from 'react';
import { Book } from '../types';
import { generateAudioPreview } from '../services/gemini';

interface BookCardProps {
  book: Book;
  index: number;
}

export const BookCard: React.FC<BookCardProps> = ({ book, index }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Stop audio when component unmounts
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handlePlayPreview = async () => {
    if (isPlaying) {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
      setIsPlaying(false);
      return;
    }

    setIsAudioLoading(true);

    try {
      const audioBuffer = await generateAudioPreview(`Here is a preview of ${book.title}. ${book.excerpt}`);
      
      // Initialize Context if not exists (browser requirement: must be after user interaction)
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
      console.error("Failed to play audio:", error);
      alert("Could not generate audio preview. Please try again.");
    } finally {
      setIsAudioLoading(false);
    }
  };

  return (
    <div 
      className="group relative w-full bg-slate-800 rounded-xl overflow-hidden shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-accent-gold/10 flex flex-col"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {/* Dynamic Accent Border based on Mood Color */}
      <div 
        className="absolute top-0 left-0 w-full h-1.5"
        style={{ backgroundColor: book.moodColor }}
      />
      
      <div className="p-6 md:p-8 flex flex-col h-full">
        <div className="mb-4 flex justify-between items-start">
          <span className="text-xs uppercase tracking-widest text-slate-400 border border-slate-700 px-2 py-1 rounded-md">
            {book.genre}
          </span>
          <button 
            onClick={handlePlayPreview}
            disabled={isAudioLoading}
            className={`group/btn relative flex items-center justify-center w-10 h-10 rounded-full border border-slate-600 transition-all duration-300
              ${isPlaying ? 'bg-accent-gold border-accent-gold text-deep-bg' : 'hover:border-accent-gold hover:text-accent-gold text-slate-400'}
            `}
            title="Listen to preview"
          >
             {isAudioLoading ? (
               <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
             ) : isPlaying ? (
               // Stop Icon
               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
             ) : (
               // Play Icon (Headphones style)
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
             )}
             
             {isPlaying && (
               <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-gold opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-gold"></span>
                </span>
             )}
          </button>
        </div>

        <h3 className="text-2xl font-serif font-bold text-white mb-1 group-hover:text-accent-gold transition-colors">
          {book.title}
        </h3>
        <p className="text-sm font-medium text-slate-400 mb-6 italic">by {book.author}</p>

        <div className="bg-slate-900/50 p-4 rounded-lg mb-6 border-l-2 border-slate-700">
           <p className="text-slate-300 text-sm leading-relaxed">
             "{book.description}"
           </p>
        </div>

        {book.firstSentence && (
          <div className="mb-6">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Opening Line</p>
            <p className="font-serif-italic text-lg text-slate-200 leading-snug">
              “{book.firstSentence}”
            </p>
          </div>
        )}
        
        <div className="mt-auto">
          {isPlaying && (
            <div className="mb-4 text-xs text-accent-gold font-medium animate-pulse flex items-center gap-2">
               <span className="w-1 h-3 bg-accent-gold animate-[pulse_0.5s_ease-in-out_infinite]"></span>
               <span className="w-1 h-5 bg-accent-gold animate-[pulse_0.7s_ease-in-out_infinite]"></span>
               <span className="w-1 h-2 bg-accent-gold animate-[pulse_0.4s_ease-in-out_infinite]"></span>
               <span>Narrating preview...</span>
            </div>
          )}
          
          <div className="pt-6 border-t border-slate-700/50">
            <div className="flex items-start gap-3">
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
    </div>
  );
};