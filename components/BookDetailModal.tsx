
import React, { useState, useEffect } from 'react';
import { Book, EnhancedDetails, UserPreferences } from '../types';
import { MoodVisualizer } from './MoodVisualizer';
import { BookCover } from './BookCover';
import { CharacterChat } from './CharacterChat';
import { fetchEnhancedBookDetails } from '../services/gemini';

interface BookDetailModalProps {
  book: Book | null;
  onClose: () => void;
  onToggleWishlist: (book: Book) => void;
  isInWishlist: boolean;
  userPrefs: UserPreferences | null;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({ book, onClose, onToggleWishlist, isInWishlist, userPrefs }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'chat'>('details');
  const [enhanced, setEnhanced] = useState<EnhancedDetails | null>(null);
  const [loadingEnhanced, setLoadingEnhanced] = useState(false);
  const [showDeepArchive, setShowDeepArchive] = useState(false);

  useEffect(() => {
    if (book) {
      setEnhanced(null);
      setLoadingEnhanced(true);
      fetchEnhancedBookDetails(book, userPrefs)
        .then(setEnhanced)
        .catch(console.error)
        .finally(() => setLoadingEnhanced(false));
    } else {
      setEnhanced(null);
      setShowDeepArchive(false);
    }
  }, [book, userPrefs]);

  if (!book) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-[#0a0a0c] w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border border-white/10 scrollbar-hide text-slate-200">
        
        <button onClick={onClose} className="absolute top-4 right-4 z-50 bg-black/50 p-1.5 rounded-full border border-white/10 hover:rotate-90 transition-all text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Compressed Header */}
        <div className="relative h-[280px] w-full flex items-end p-6 md:p-10">
            <div className="absolute inset-0 pointer-events-none">
                <BookCover isbn={book.isbn} title={book.title} author={book.author} moodColor={book.moodColor} className="w-full h-full opacity-20 blur-2xl" showText={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/40 to-transparent" />
            </div>

            <div className="relative z-10 flex items-end gap-6 w-full">
                <div className="hidden md:block w-32 aspect-[2/3] rounded shadow-xl border border-white/10 overflow-hidden transform translate-y-4">
                    <BookCover isbn={book.isbn} title={book.title} author={book.author} moodColor={book.moodColor} className="w-full h-full" />
                </div>
                <div className="flex-1">
                    <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-1 leading-tight">{book.title}</h2>
                    <p className="text-lg text-accent-gold/80 font-serif italic">By {book.author}</p>
                    
                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">
                        {book.publishedDate && (
                          <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded border border-white/5">
                            <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {book.publishedDate.substring(0, 4)}
                          </span>
                        )}
                        {book.pageCount && (
                           <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded border border-white/5">
                             <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                             {book.pageCount} pgs
                           </span>
                        )}
                        {book.averageRating && (
                           <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded border border-white/5 text-slate-300">
                             <svg className="w-3 h-3 text-accent-gold" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                             {book.averageRating}
                           </span>
                        )}
                        {book.publisher && (
                           <span className="opacity-60 hidden md:inline-block border-l border-white/10 pl-3">
                             {book.publisher}
                           </span>
                        )}
                    </div>
                    
                    {enhanced && (
                      <p className="text-xs md:text-sm text-slate-400 font-light mt-4 italic border-l border-accent-gold/40 pl-3">
                        {enhanced.literaryIdentity}
                      </p>
                    )}
                </div>
            </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/5 px-6 md:px-10 sticky top-0 bg-[#0a0a0c]/90 backdrop-blur-xl z-[40]">
            <button onClick={() => setActiveTab('details')} className={`py-4 px-6 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'details' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                Curation
                {activeTab === 'details' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent-gold" />}
            </button>
            <button onClick={() => setActiveTab('chat')} className={`py-4 px-6 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'chat' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                Echo
                {activeTab === 'chat' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent-gold" />}
            </button>
        </div>

        <div className="p-6 md:p-10">
          {activeTab === 'details' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              <div className="lg:col-span-2 space-y-10">
                
                {loadingEnhanced ? (
                  <div className="space-y-8 animate-pulse">
                    <div className="h-10 bg-white/5 rounded-lg w-1/3"></div>
                    <div className="h-24 bg-white/5 rounded-lg"></div>
                    <div className="grid grid-cols-3 gap-4">
                       <div className="h-16 bg-white/5 rounded-lg"></div>
                       <div className="h-16 bg-white/5 rounded-lg"></div>
                       <div className="h-16 bg-white/5 rounded-lg"></div>
                    </div>
                  </div>
                ) : enhanced ? (
                  <>
                    {/* Why This Fits Now */}
                    <section className="space-y-3">
                      <h4 className="text-accent-gold text-[10px] font-bold uppercase tracking-[0.2em]">Atmospheric Context</h4>
                      <ul className="space-y-2">
                        {enhanced.whyFitsNow.map((bullet, i) => (
                          <li key={i} className="text-lg md:text-xl font-serif text-white leading-snug italic font-light">
                             "{bullet}"
                          </li>
                        ))}
                      </ul>
                    </section>

                    {/* Commitment & Arc (Tightened) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <section className="p-5 bg-white/5 rounded-lg border border-white/10 space-y-4">
                        <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Commitment</h4>
                        <div className="flex flex-wrap gap-4">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-slate-500 uppercase">Attention</span>
                            <span className="text-sm text-white font-bold">{enhanced.commitment.attention}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] text-slate-500 uppercase">Weight</span>
                            <span className="text-sm text-white font-bold">{enhanced.commitment.weight}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] text-slate-500 uppercase">Pacing</span>
                            <span className="text-sm text-white font-bold">{enhanced.commitment.pacing}</span>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-white/5">
                           <span className="text-[9px] text-slate-500 uppercase block mb-1">Emotional Arc</span>
                           <span className="text-sm text-accent-gold italic font-serif">{enhanced.emotionalArc}</span>
                        </div>
                      </section>
                      <section className="p-5 bg-white/5 rounded-lg border border-white/10 space-y-4">
                         <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Decision Guidance</h4>
                         <div className="space-y-3">
                            <div>
                               <span className="text-[9px] text-emerald-500 uppercase font-bold block">Read if...</span>
                               <ul className="text-xs text-slate-300 italic">
                                  {enhanced.readWhen.map((w, i) => <li key={i}>• {w}</li>)}
                               </ul>
                            </div>
                            <div>
                               <span className="text-[9px] text-red-400 uppercase font-bold block">Avoid if...</span>
                               <ul className="text-xs text-slate-300 italic">
                                  {enhanced.avoidWhen.map((w, i) => <li key={i}>• {w}</li>)}
                               </ul>
                            </div>
                         </div>
                      </section>
                    </div>

                    {/* Micro-Synopsis */}
                    <section className="space-y-3 pt-6 border-t border-white/5">
                      <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Micro-Synopsis</h4>
                      <p className="text-lg font-serif text-slate-200 leading-relaxed font-light italic">
                        "{enhanced.microSynopsis}"
                      </p>
                    </section>

                    {/* Insight & Justification */}
                    <div className="space-y-4">
                        <section className="bg-accent-gold/5 p-5 rounded-lg border-l-2 border-accent-gold">
                           <h4 className="text-accent-gold text-[9px] font-bold uppercase tracking-widest mb-2">Signature Insight</h4>
                           <p className="text-sm text-white italic font-serif">
                             {enhanced.readDifferentlyInsight}
                           </p>
                        </section>
                        <p className="text-[10px] text-slate-500 italic opacity-60 px-2">
                           {enhanced.sectionJustification}
                        </p>
                    </div>

                    {/* Grounding Sources (Always displayed if present) */}
                    {book.sources && book.sources.length > 0 && (
                      <section className="pt-6 border-t border-white/5">
                        <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3">Verification Sources</h4>
                        <div className="flex flex-wrap gap-2">
                          {book.sources.map((source, i) => (
                            <a 
                              key={i} 
                              href={source.uri} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full text-accent-gold flex items-center gap-2 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                              {source.title || "External Source"}
                            </a>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Deep Archive (Minimal) */}
                    <section className="pt-6">
                      <button 
                        onClick={() => setShowDeepArchive(!showDeepArchive)}
                        className="flex items-center gap-2 text-slate-500 hover:text-white text-[10px] uppercase font-bold tracking-[0.2em] transition-colors"
                      >
                        {showDeepArchive ? 'Collapse Archive' : 'Deep Archive'}
                        <svg className={`w-3 h-3 transition-transform duration-300 ${showDeepArchive ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      
                      {showDeepArchive && (
                        <div className="mt-4 space-y-6 animate-fade-in p-6 bg-black/40 rounded-lg border border-white/5">
                           <div className="space-y-2">
                              <h5 className="text-white text-[9px] font-bold uppercase">Archive Synopsis</h5>
                              <p className="text-slate-400 text-xs leading-relaxed">{enhanced.deepArchive.fullSynopsis}</p>
                           </div>
                           <div className="space-y-2">
                              <h5 className="text-white text-[9px] font-bold uppercase">Author Background</h5>
                              <p className="text-slate-400 text-xs italic">{enhanced.deepArchive.authorBackground}</p>
                           </div>
                        </div>
                      )}
                    </section>
                  </>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-slate-600 italic">Attempting to sync with the library spirits...</p>
                  </div>
                )}
              </div>

              {/* Sidebar Sensory Profile */}
              <div className="space-y-8">
                <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5 space-y-6 shadow-2xl backdrop-blur-sm">
                    <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-accent-gold rounded-full animate-pulse"></div>
                      Atmospheric Profile
                    </h4>
                    
                    {enhanced ? (
                      <div className="space-y-4 animate-fade-in">
                        {/* Narrative Tone Card */}
                        <div className="flex items-start gap-4 p-3 bg-white/[0.03] rounded-lg border border-white/5 hover:border-accent-gold/20 transition-all group/item cursor-default">
                          <div className="mt-1 text-accent-gold group-hover/item:scale-110 transition-transform bg-accent-gold/10 p-2 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest block mb-0.5 opacity-60">Narrative Tone</span>
                            <p className="text-white font-serif italic text-sm leading-snug">{enhanced.atmosphericProfile.tone}</p>
                          </div>
                        </div>

                        {/* Visual Imagery Card */}
                        <div className="flex items-start gap-4 p-3 bg-white/[0.03] rounded-lg border border-white/5 hover:border-accent-gold/20 transition-all group/item cursor-default">
                          <div className="mt-1 text-accent-gold group-hover/item:scale-110 transition-transform bg-accent-gold/10 p-2 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest block mb-0.5 opacity-60">Visual Imagery</span>
                            <p className="text-white font-serif italic text-sm leading-snug">{enhanced.atmosphericProfile.imagery}</p>
                          </div>
                        </div>

                        {/* Best Time Card */}
                        <div className="flex items-start gap-4 p-3 bg-accent-gold/[0.04] rounded-lg border border-accent-gold/10 hover:border-accent-gold/30 transition-all group/item cursor-default">
                          <div className="mt-1 text-accent-gold group-hover/item:scale-110 transition-transform bg-accent-gold/20 p-2 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest block mb-0.5 opacity-80">Optimal Moment</span>
                            <p className="text-accent-gold font-serif italic text-sm leading-snug font-bold">{enhanced.atmosphericProfile.bestTime}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-24 flex items-center justify-center">
                        <div className="flex gap-2">
                          <div className="w-1.5 h-1.5 bg-accent-gold/40 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-accent-gold/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-1.5 h-1.5 bg-accent-gold/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        </div>
                      </div>
                    )}
                    
                    <MoodVisualizer initialPrompt={`Micro-aesthetic of ${book.title}, vibe: ${enhanced?.atmosphericProfile.imagery || book.genre}, tone: ${enhanced?.atmosphericProfile.tone || 'cinematic'}`} />
                </div>
                
                <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => onToggleWishlist(book)} 
                      className={`py-3 rounded text-[10px] font-bold transition-all border uppercase tracking-widest ${isInWishlist ? 'bg-accent-gold/10 border-accent-gold text-accent-gold' : 'bg-white/5 border-white/10 text-white hover:bg-white hover:text-black'}`}
                    >
                        {isInWishlist ? 'In Archive' : 'Store Locally'}
                    </button>
                    {book.buyLink || book.ebookUrl ? (
                        <a href={book.buyLink || book.ebookUrl} target="_blank" rel="noreferrer" className="py-3 rounded bg-accent-gold text-deep-bg text-center font-bold text-[10px] uppercase tracking-widest hover:bg-yellow-500 transition-all shadow-xl">
                            Access Now
                        </a>
                    ) : null}
                </div>
              </div>

            </div>
          ) : (
            <CharacterChat bookTitle={book.title} author={book.author} onClose={() => setActiveTab('details')} />
          )}
        </div>
      </div>
    </div>
  );
};
