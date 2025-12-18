
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
                    {enhanced && (
                      <p className="text-xs md:text-sm text-slate-400 font-light mt-2 italic border-l border-accent-gold/40 pl-3">
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
                <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5 space-y-6">
                    <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Atmospheric Profile</h4>
                    
                    {enhanced ? (
                      <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                               <span className="text-[8px] text-slate-500 uppercase font-bold">Tone</span>
                               <p className="text-white font-serif italic text-sm">{enhanced.atmosphericProfile.tone}</p>
                            </div>
                            <div>
                               <span className="text-[8px] text-slate-500 uppercase font-bold">Imagery</span>
                               <p className="text-white font-serif italic text-sm">{enhanced.atmosphericProfile.imagery}</p>
                            </div>
                        </div>
                        <div>
                           <span className="text-[8px] text-slate-500 uppercase font-bold">Best Time</span>
                           <p className="text-accent-gold font-serif italic text-sm">{enhanced.atmosphericProfile.bestTime}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-20 flex items-center justify-center italic text-slate-700 text-xs">Calibrating sensory sensors...</div>
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
