import React from 'react';
import { Book } from '../types';
import { MoodVisualizer } from './MoodVisualizer';
import { setActiveRead } from '../services/storage';
import { BookCover } from './BookCover';

interface BookDetailModalProps {
  book: Book | null;
  onClose: () => void;
  onToggleWishlist: (book: Book) => void;
  isInWishlist: boolean;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({ book, onClose, onToggleWishlist, isInWishlist }) => {
  if (!book) return null;

  const handleStartReading = () => {
    setActiveRead(book);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-[#18181b] w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl animate-slide-up border border-slate-700">
        <button onClick={onClose} className="absolute top-4 right-4 z-50 bg-black/50 rounded-full p-2 hover:bg-black transition-colors border border-white/10 group">
          <svg className="w-6 h-6 text-white group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Hero Banner inside Modal */}
        <div className="relative h-[400px] w-full overflow-hidden">
           {/* Background Blurred Image */}
           <div className="absolute inset-0 w-full h-full">
             <BookCover 
               isbn={book.isbn} 
               title={book.title} 
               author={book.author} 
               moodColor={book.moodColor} 
               className="w-full h-full opacity-30 blur-2xl scale-110" 
               showText={false}
             />
           </div>
           
           <div className="absolute inset-0" style={{ backgroundColor: book.moodColor, opacity: 0.5, mixBlendMode: 'multiply' }} />
           <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-[#18181b]/60 to-transparent" />
           
           <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 flex flex-col md:flex-row gap-8 items-end z-20">
              {/* Poster Image */}
              <div className="hidden md:block w-56 aspect-[2/3] rounded-lg shadow-2xl overflow-hidden border-4 border-white/5 relative shrink-0 transform translate-y-16 hover:scale-105 transition-transform duration-500">
                 <BookCover 
                   isbn={book.isbn} 
                   title={book.title} 
                   author={book.author} 
                   moodColor={book.moodColor}
                   className="w-full h-full"
                 />
              </div>

              <div className="max-w-3xl pb-2 md:pb-6">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="text-xs uppercase tracking-widest text-accent-gold border border-accent-gold/30 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md shadow-sm">
                        {book.genre}
                    </span>
                    {book.isbn && <span className="text-xs text-slate-400 border border-slate-700 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md font-mono">ISBN: {book.isbn}</span>}
                  </div>
                  <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-3 leading-tight drop-shadow-2xl">{book.title}</h2>
                  <p className="text-xl md:text-2xl text-slate-200 font-light flex items-center gap-2">
                    <span className="opacity-60">by</span> {book.author}
                  </p>
              </div>
           </div>
        </div>

        <div className="p-6 md:p-12 md:pt-24 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-10">
            {/* Buttons Row - Fixed Overlap */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={handleStartReading}
                className="flex-1 bg-white text-black font-bold py-4 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.15)] text-lg hover:-translate-y-1 active:scale-95"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                Mark as Reading
              </button>
              
              {book.ebookUrl && (
                <a 
                  href={book.ebookUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 bg-accent-gold text-deep-bg font-bold py-4 rounded-xl hover:bg-yellow-500 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(212,175,55,0.3)] text-lg hover:-translate-y-1 active:scale-95"
                >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                   Get E-Book
                </a>
              )}

              <button 
                onClick={() => onToggleWishlist(book)}
                className="flex-1 border-2 border-slate-600 text-slate-200 font-bold py-4 rounded-xl hover:border-white hover:text-white transition-all flex items-center justify-center gap-3 text-lg hover:-translate-y-1 active:scale-95"
              >
                 {isInWishlist ? (
                   <>
                     <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                     Saved
                   </>
                 ) : (
                   <>
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                     Wishlist
                   </>
                 )}
              </button>
            </div>
            
            <div className="bg-slate-800/30 p-8 rounded-2xl border-l-4 border-accent-gold backdrop-blur-sm">
               <p className="text-xl md:text-2xl text-slate-200 leading-relaxed italic font-serif opacity-90">"{book.excerpt}"</p>
            </div>
            
            <div className="space-y-4">
               <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                 <span className="w-2 h-8 bg-accent-gold rounded-full"></span>
                 Synopsis
               </h3>
               <p className="text-slate-300 leading-loose text-lg font-light tracking-wide">{book.description}</p>
            </div>
            
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-inner">
               <h4 className="text-accent-gold text-xs font-bold uppercase mb-3 tracking-widest">Why it fits your vibe</h4>
               <p className="text-slate-200 text-lg leading-relaxed">{book.reasoning}</p>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-8">
             {/* Mobile Cover (Visible only on small screens) */}
             <div className="block md:hidden w-full aspect-[2/3] rounded-lg overflow-hidden shadow-2xl mb-8">
                <BookCover 
                   isbn={book.isbn} 
                   title={book.title} 
                   author={book.author} 
                   moodColor={book.moodColor}
                   className="w-full h-full"
                 />
             </div>

            <div className="bg-[#0a0a0c] p-6 rounded-xl border border-slate-800">
               <h4 className="text-slate-500 text-sm font-bold uppercase mb-4 tracking-widest">Mood Visualizer</h4>
               <MoodVisualizer initialPrompt={`A minimalist, cinematic book cover design for ${book.title} by ${book.author}, genre ${book.genre}, dominant color ${book.moodColor}, high quality 4k`} />
               
               <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 block mb-1 uppercase">Mood Tone</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full shadow-sm" style={{backgroundColor: book.moodColor}}></div>
                      <span className="text-sm text-white font-mono">{book.moodColor}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1 uppercase">Genre</span>
                    <span className="text-sm text-white">{book.genre}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};