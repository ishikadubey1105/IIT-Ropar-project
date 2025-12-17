import React, { useState, useEffect } from 'react';
import { Book, ReadingProgress } from '../types';
import { MoodVisualizer } from './MoodVisualizer';
import { setActiveRead, getActiveRead, getReadingProgress, saveReadingProgress } from '../services/storage';
import { BookCover } from './BookCover';
import { CharacterChat } from './CharacterChat';

interface BookDetailModalProps {
  book: Book | null;
  onClose: () => void;
  onToggleWishlist: (book: Book) => void;
  isInWishlist: boolean;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({ book, onClose, onToggleWishlist, isInWishlist }) => {
  const [isShared, setIsShared] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'chat'>('details');
  const [isActiveRead, setIsActiveRead] = useState(false);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);

  useEffect(() => {
    if (book) {
      const currentActive = getActiveRead();
      const isCurrent = currentActive?.title === book.title && currentActive?.author === book.author;
      setIsActiveRead(isCurrent);

      if (isCurrent) {
        setProgress(getReadingProgress());
      }
    }
  }, [book]);

  if (!book) return null;

  const handleStartReading = () => {
    setActiveRead(book);
    setIsActiveRead(true);
    setProgress(getReadingProgress()); // Fetch the initialized progress
  };

  const handleProgressChange = (newPage: number) => {
    if (!progress) return;
    const safePage = Math.min(Math.max(0, newPage), progress.totalPages);
    const newPercentage = Math.round((safePage / progress.totalPages) * 100);
    
    const updated: ReadingProgress = {
      ...progress,
      currentPage: safePage,
      percentage: newPercentage,
      lastUpdated: new Date().toISOString()
    };
    
    setProgress(updated);
    saveReadingProgress(updated);
  };

  const handleTotalPagesChange = (newTotal: number) => {
    if (!progress) return;
    const updated: ReadingProgress = {
      ...progress,
      totalPages: newTotal,
      percentage: Math.round((progress.currentPage / newTotal) * 100),
    };
    setProgress(updated);
    saveReadingProgress(updated);
  };

  const handleShare = async () => {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-[#0a0a0c]/90 w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl animate-slide-up border border-white/10">
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
               coverUrl={book.coverUrl}
             />
           </div>
           
           <div className="absolute inset-0" style={{ backgroundColor: book.moodColor, opacity: 0.5, mixBlendMode: 'multiply' }} />
           <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/60 to-transparent" />
           
           <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 flex flex-col md:flex-row gap-8 items-end z-20">
              {/* Poster Image */}
              <div className="hidden md:block w-56 aspect-[2/3] rounded-lg shadow-2xl overflow-hidden border-4 border-white/5 relative shrink-0 transform translate-y-16 hover:scale-105 transition-transform duration-500">
                 <BookCover 
                   isbn={book.isbn} 
                   title={book.title} 
                   author={book.author} 
                   moodColor={book.moodColor}
                   className="w-full h-full"
                   coverUrl={book.coverUrl}
                 />
              </div>

              <div className="max-w-3xl pb-2 md:pb-6">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="text-xs uppercase tracking-widest font-bold text-accent-gold border border-accent-gold/20 px-3 py-1 rounded-full bg-accent-gold/10 backdrop-blur-md shadow-sm">
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-8 px-6 md:px-12 border-b border-white/10 sticky top-0 bg-[#0a0a0c]/95 z-40 backdrop-blur-xl">
             <button 
                onClick={() => setActiveTab('details')}
                className={`py-4 text-sm font-bold uppercase tracking-widest transition-colors relative ${activeTab === 'details' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
             >
                The Book
                {activeTab === 'details' && <span className="absolute bottom-0 left-0 w-full h-1 bg-accent-gold rounded-t-full"></span>}
             </button>
             <button 
                onClick={() => setActiveTab('chat')}
                className={`py-4 text-sm font-bold uppercase tracking-widest transition-colors relative flex items-center gap-2 ${activeTab === 'chat' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
             >
                <span className="w-2 h-2 rounded-full bg-accent-gold animate-pulse"></span>
                Echoes (Chat)
                {activeTab === 'chat' && <span className="absolute bottom-0 left-0 w-full h-1 bg-accent-gold rounded-t-full"></span>}
             </button>
        </div>

        <div className="p-6 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-10">
            {activeTab === 'details' ? (
                <>
                {/* Buttons Row */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4 flex-wrap">
                <button 
                    onClick={handleStartReading}
                    disabled={isActiveRead}
                    className={`flex-1 min-w-[140px] font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.15)] text-lg hover:-translate-y-1 active:scale-95
                      ${isActiveRead ? 'bg-emerald-500 text-white cursor-default hover:translate-y-0 hover:bg-emerald-500' : 'bg-white text-black hover:bg-slate-200'}`}
                >
                    {isActiveRead ? (
                       <>
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                         Currently Reading
                       </>
                    ) : (
                       <>
                         <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                         Mark as Reading
                       </>
                    )}
                </button>
                
                {book.ebookUrl && (
                    <a 
                    href={book.buyLink || book.ebookUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[140px] bg-accent-gold text-deep-bg font-bold py-4 rounded-xl hover:bg-yellow-500 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(212,175,55,0.3)] text-lg hover:-translate-y-1 active:scale-95"
                    >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    {book.saleability === 'FREE' ? 'Read for Free' : 'Get E-Book'}
                    </a>
                )}
                
                <a 
                  href={`https://www.audible.com/search?keywords=${encodeURIComponent(book.title + ' ' + book.author)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[140px] bg-purple-600/20 text-purple-300 border border-purple-500/50 font-bold py-4 rounded-xl hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-3 text-lg hover:-translate-y-1 active:scale-95"
                >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                   Find Audiobook
                </a>

                <button 
                    onClick={() => onToggleWishlist(book)}
                    className="flex-1 min-w-[140px] border-2 border-slate-600 text-slate-200 font-bold py-4 rounded-xl hover:border-white hover:text-white transition-all flex items-center justify-center gap-3 text-lg hover:-translate-y-1 active:scale-95"
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

                <button 
                    onClick={handleShare}
                    className={`flex-1 min-w-[140px] border-2 border-slate-600 text-slate-200 font-bold py-4 rounded-xl hover:border-blue-400 hover:text-blue-400 transition-all flex items-center justify-center gap-3 text-lg hover:-translate-y-1 active:scale-95 ${isShared ? 'border-emerald-500 text-emerald-500' : ''}`}
                >
                    {isShared ? (
                    <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Copied
                    </>
                    ) : (
                    <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        Share
                    </>
                    )}
                </button>
                </div>
                
                {/* READING PROGRESS SECTION (NEW) */}
                {isActiveRead && progress && (
                  <div className="bg-white/5 p-6 md:p-8 rounded-2xl border border-accent-gold/20 shadow-inner animate-fade-in relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-12 bg-accent-gold/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                     
                     <div className="flex justify-between items-center mb-6 relative z-10">
                        <h3 className="text-xl font-serif font-bold text-accent-gold flex items-center gap-2">
                           <span className="animate-pulse">●</span> Journey Progress
                        </h3>
                        <span className="text-4xl font-bold text-white tracking-tighter">{progress.percentage}%</span>
                     </div>

                     <div className="relative h-4 bg-slate-800 rounded-full mb-8 overflow-hidden">
                        <div 
                           className="absolute top-0 left-0 h-full bg-gradient-to-r from-accent-gold to-yellow-200 transition-all duration-500 ease-out rounded-full shadow-[0_0_15px_rgba(212,175,55,0.5)]"
                           style={{ width: `${progress.percentage}%` }}
                        ></div>
                     </div>

                     <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="flex-1 w-full">
                           <input 
                              type="range" 
                              min="0" 
                              max={progress.totalPages} 
                              value={progress.currentPage} 
                              onChange={(e) => handleProgressChange(parseInt(e.target.value))}
                              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-accent-gold hover:accent-yellow-400"
                           />
                        </div>
                        <div className="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-lg border border-white/10">
                           <span className="text-slate-400 text-xs uppercase tracking-wide">Page</span>
                           <input 
                              type="number" 
                              value={progress.currentPage}
                              onChange={(e) => handleProgressChange(parseInt(e.target.value))}
                              className="w-16 bg-transparent text-white font-bold text-center border-b border-slate-600 focus:border-accent-gold focus:outline-none"
                           />
                           <span className="text-slate-500">of</span>
                           <input 
                              type="number" 
                              value={progress.totalPages}
                              onChange={(e) => handleTotalPagesChange(parseInt(e.target.value))}
                              className="w-16 bg-transparent text-slate-300 font-medium text-center border-b border-transparent hover:border-slate-600 focus:border-accent-gold focus:outline-none transition-colors"
                           />
                        </div>
                     </div>
                  </div>
                )}

                <div className="bg-white/5 p-8 rounded-2xl border-l-4 border-accent-gold backdrop-blur-sm">
                <p className="text-xl md:text-2xl text-slate-200 leading-relaxed italic font-serif opacity-90">"{book.excerpt}"</p>
                </div>

                {/* METADATA GRID */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-t border-b border-white/10">
                {book.publishedDate && (
                    <div className="space-y-1">
                    <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Published</span>
                    <p className="text-white font-medium">{book.publishedDate}</p>
                    </div>
                )}
                {book.publisher && (
                    <div className="space-y-1">
                    <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Publisher</span>
                    <p className="text-white font-medium truncate" title={book.publisher}>{book.publisher}</p>
                    </div>
                )}
                {book.pageCount && (
                    <div className="space-y-1">
                    <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Length</span>
                    <p className="text-white font-medium">{book.pageCount} pages</p>
                    </div>
                )}
                {book.averageRating && (
                    <div className="space-y-1">
                    <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Rating</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-accent-gold text-lg">★</span>
                        <p className="text-white font-medium">{book.averageRating} <span className="text-slate-500 text-xs">({book.ratingsCount || 0})</span></p>
                    </div>
                    </div>
                )}
                </div>
                
                {/* E-Book Metadata Section */}
                {(book.isEbook || book.saleability !== 'NOT_FOR_SALE') && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-500/30">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500/20 p-2 rounded-full text-blue-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            </div>
                            <div>
                                <h5 className="text-white font-bold">Digital Edition</h5>
                                <div className="flex gap-2 text-xs mt-1">
                                    {book.epubAvailable && <span className="bg-green-500/20 text-green-300 px-2 py-0.5 rounded border border-green-500/30">ePub</span>}
                                    {book.pdfAvailable && <span className="bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30">PDF</span>}
                                    {book.accessViewStatus === 'FULL_PUBLIC_DOMAIN' && <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">Public Domain</span>}
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-right">
                            {book.saleability === 'FREE' && <span className="text-2xl font-bold text-emerald-400">Free</span>}
                            {book.price && (
                                <div className="flex flex-col items-end">
                                    <span className="text-slate-400 text-xs uppercase">Price</span>
                                    <span className="text-2xl font-bold text-white">{book.price.amount} <span className="text-sm text-slate-400">{book.price.currencyCode}</span></span>
                                </div>
                            )}
                            {(book.buyLink || book.ebookUrl) && (
                                <a href={book.buyLink || book.ebookUrl} target="_blank" rel="noreferrer" className="text-xs text-accent-gold hover:underline block mt-1">
                                    {book.saleability === 'FREE' ? 'Read Now' : 'Buy / Download'} &rarr;
                                </a>
                            )}
                        </div>
                    </div>
                </div>
                )}

                <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-8 bg-accent-gold rounded-full"></span>
                    Synopsis
                </h3>
                <p className="text-slate-300 leading-loose text-lg font-light tracking-wide">{book.description}</p>
                </div>
                
                {/* SENSORY PAIRINGS (New Unique Feature) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {book.moviePairing && (
                    <div className="bg-gradient-to-r from-[#1e1b4b] to-black rounded-xl p-6 border border-indigo-500/30 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>
                        </div>
                        <h4 className="text-indigo-300 text-xs font-bold uppercase mb-2 tracking-widest relative z-10">Atmospheric Media Pairing</h4>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>
                            </div>
                            <p className="text-indigo-100 font-serif italic">{book.moviePairing}</p>
                        </div>
                    </div>
                    )}

                    {book.musicPairing && (
                    <div className="bg-gradient-to-r from-emerald-900/40 to-black rounded-xl p-6 border border-emerald-500/30 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4 opacity-20">
                            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M9 19V6l12-3v13M9 10l12-3" /></svg>
                         </div>
                        <h4 className="text-emerald-300 text-xs font-bold uppercase mb-2 tracking-widest relative z-10">Soundtrack Pairing</h4>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 10l12-3" /></svg>
                            </div>
                            <p className="text-emerald-100 font-serif italic">{book.musicPairing}</p>
                        </div>
                    </div>
                    )}
                    
                    {book.foodPairing && (
                     <div className="md:col-span-2 bg-gradient-to-r from-orange-900/40 to-black rounded-xl p-6 border border-orange-500/30 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                             <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h18v18H3V3m2 2v14h14V5H5m4 2h6v2H9V7m0 4h6v2H9v-2m0 4h6v2H9v-2z" /></svg>
                        </div>
                        <h4 className="text-orange-300 text-xs font-bold uppercase mb-2 tracking-widest relative z-10">Taste & Scent Pairing</h4>
                        <div className="flex items-center gap-4 relative z-10">
                             <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                                 <svg className="w-5 h-5 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             </div>
                             <p className="text-orange-100 font-serif italic">{book.foodPairing}</p>
                        </div>
                     </div>
                    )}
                </div>

                <div className="bg-gradient-to-br from-white/10 to-transparent rounded-xl p-6 border border-white/10 shadow-inner">
                <h4 className="text-accent-gold text-xs font-bold uppercase mb-3 tracking-widest">Why it fits your vibe</h4>
                <p className="text-slate-200 text-lg leading-relaxed">{book.reasoning}</p>
                </div>
                </>
            ) : (
                <div className="animate-fade-in">
                    <div className="bg-gradient-to-r from-accent-gold/20 to-transparent p-6 rounded-xl border border-accent-gold/30 mb-8 flex items-center gap-4">
                        <div className="p-3 bg-black rounded-full text-accent-gold">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Echoes: Speak to the Character</h3>
                            <p className="text-sm text-slate-300">Interact with the soul of this book before you read it.</p>
                        </div>
                    </div>
                    <CharacterChat bookTitle={book.title} author={book.author} onClose={() => setActiveTab('details')} />
                </div>
            )}
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
                   coverUrl={book.coverUrl}
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
            
            {activeTab === 'details' && (
                <div 
                   onClick={() => setActiveTab('chat')}
                   className="p-6 rounded-xl border border-dashed border-slate-700 hover:border-accent-gold hover:bg-white/5 transition-all cursor-pointer group text-center"
                >
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-slate-300 group-hover:text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </div>
                    <h4 className="text-white font-bold mb-1">Have a Question?</h4>
                    <p className="text-xs text-slate-400">Ask the main character directly.</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};