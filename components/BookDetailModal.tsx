
import React, { useState, useEffect } from 'react';
import { Book, EnhancedDetails, UserPreferences } from '../types';
import { MoodVisualizer } from './MoodVisualizer';
import { BookCover } from './BookCover';
import { CharacterChat } from './CharacterChat';
import { fetchEnhancedBookDetails } from '../services/gemini';
import { FocusMode } from './FocusMode';

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
  const [isFocusMode, setIsFocusMode] = useState(false);

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
      setIsFocusMode(false);
    }
  }, [book, userPrefs]);

  if (!book) return null;

  if (isFocusMode && enhanced) {
    return <FocusMode book={book} enhanced={enhanced} onExit={() => setIsFocusMode(false)} />;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-[#0a0a0c] w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border border-white/10 scrollbar-hide text-slate-200">
        
        <button onClick={onClose} className="absolute top-4 right-4 z-50 bg-black/50 p-1.5 rounded-full border border-white/10 hover:rotate-90 transition-all text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

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
                    
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">
                        {book.publishedDate && (
                          <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded border border-white/5">
                            {book.publishedDate.substring(0, 4)}
                          </span>
                        )}
                        {book.pageCount && (
                           <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded border border-white/5">
                             {book.pageCount} pgs
                           </span>
                        )}
                    </div>
                    
                    {enhanced && (
                      <p className="text-xs md:text-sm text-slate-400 font-light mt-4 italic border-l border-accent-gold/40 pl-3 max-w-2xl">
                        {enhanced.literaryIdentity}
                      </p>
                    )}
                </div>
            </div>
        </div>

        <div className="flex border-b border-white/5 px-6 md:px-10 sticky top-0 bg-[#0a0a0c]/90 backdrop-blur-xl z-[40]">
            <button onClick={() => setActiveTab('details')} className={`py-4 px-6 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'details' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                Curation
                {activeTab === 'details' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent-gold" />}
            </button>
            <button onClick={() => setActiveTab('chat')} className={`py-4 px-6 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'chat' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                Echo
                {activeTab === 'chat' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent-gold" />}
            </button>
            <div className="flex-1" />
            <button 
                disabled={!enhanced}
                onClick={() => setIsFocusMode(true)}
                className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-accent-gold flex items-center gap-2 hover:bg-white/5 disabled:opacity-30"
            >
                <div className="w-2 h-2 rounded-full bg-accent-gold animate-pulse"></div>
                Focus Mode
            </button>
        </div>

        <div className="p-6 md:p-10">
          {activeTab === 'details' ? (
            <div className="space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-10">
                  <section className="space-y-4">
                     <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500 flex items-center gap-2">
                        <div className="w-1 h-1 bg-accent-gold"></div>
                        Atmospheric Profile
                     </h3>
                     <p className="text-lg md:text-xl font-serif font-light leading-relaxed text-slate-300">
                        "{book.description}"
                     </p>
                  </section>

                  {enhanced && (
                    <section className="space-y-6 animate-fade-in">
                       <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500 flex items-center gap-2">
                          <div className="w-1 h-1 bg-accent-gold"></div>
                          The Sensory Atrium
                       </h3>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { icon: '🎵', label: 'Sound', val: enhanced.sensoryPairing.sound },
                            { icon: '🕯️', label: 'Scent', val: enhanced.sensoryPairing.scent },
                            { icon: '🍵', label: 'Sip', val: enhanced.sensoryPairing.sip },
                            { icon: '💡', label: 'Lighting', val: enhanced.sensoryPairing.lighting }
                          ].map((pair, idx) => (
                            <div key={idx} className="bg-white/[0.03] border border-white/5 p-4 rounded-xl group hover:border-accent-gold/30 transition-colors">
                               <div className="text-xl mb-2">{pair.icon}</div>
                               <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">{pair.label}</div>
                               <div className="text-xs font-medium text-slate-200 line-clamp-2">{pair.val}</div>
                            </div>
                          ))}
                       </div>
                    </section>
                  )}

                  <section className="pt-6 border-t border-white/5 flex flex-wrap gap-4">
                    <button 
                      onClick={() => onToggleWishlist(book)}
                      className={`px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${isInWishlist ? 'bg-accent-gold text-deep-bg' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                      {isInWishlist ? 'Remove from Archive' : 'Add to Archive'}
                    </button>
                    {book.buyLink && (
                       <a href={book.buyLink} target="_blank" rel="noopener noreferrer" className="px-8 py-3 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-accent-gold transition-all">
                         Acquire Volume
                       </a>
                    )}
                  </section>
                </div>

                <aside className="space-y-8">
                  {loadingEnhanced ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="h-4 w-1/2 bg-white/5 rounded"></div>
                      <div className="h-20 w-full bg-white/5 rounded"></div>
                    </div>
                  ) : enhanced ? (
                    <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/10 space-y-6">
                       <h4 className="text-[10px] uppercase tracking-widest font-bold text-accent-gold">Curation Logic</h4>
                       <div className="space-y-4">
                          <div className="space-y-1">
                             <div className="text-[9px] text-slate-500 uppercase tracking-widest">Moment Fit</div>
                             <div className="text-sm italic font-serif text-slate-300">"{enhanced.sectionJustification}"</div>
                          </div>
                          <div className="space-y-1">
                             <div className="text-[9px] text-slate-500 uppercase tracking-widest">Commitment</div>
                             <div className="flex gap-2">
                                <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 border border-white/5">{enhanced.commitment.attention} focus</span>
                                <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 border border-white/5">{enhanced.commitment.pacing} pace</span>
                             </div>
                          </div>
                       </div>
                       
                       <MoodVisualizer initialPrompt={`An atmospheric scene reflecting: ${enhanced.atmosphericProfile.imagery}. Tones of ${book.moodColor}.`} />
                    </div>
                  ) : null}
                </aside>
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
