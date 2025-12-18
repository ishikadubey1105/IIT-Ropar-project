
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
  const [activeTab, setActiveTab] = useState<'details' | 'chat'>('details');
  const [isActiveRead, setIsActiveRead] = useState(false);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);

  useEffect(() => {
    if (book) {
      const currentActive = getActiveRead();
      const isCurrent = currentActive?.title === book.title && currentActive?.author === book.author;
      setIsActiveRead(isCurrent);
      if (isCurrent) setProgress(getReadingProgress());
    }
  }, [book]);

  if (!book) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-[#0a0a0c] w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl border border-white/10 scrollbar-hide">
        <button onClick={onClose} className="absolute top-6 right-6 z-50 bg-black/50 p-2 rounded-full border border-white/10 hover:rotate-90 transition-all">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Cinematic Header */}
        <div className="relative h-[450px] w-full flex items-end p-8 md:p-16">
            <div className="absolute inset-0 pointer-events-none">
                <BookCover isbn={book.isbn} title={book.title} author={book.author} moodColor={book.moodColor} className="w-full h-full opacity-30 blur-3xl scale-125" showText={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/40 to-transparent" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-end gap-10 w-full">
                <div className="hidden md:block w-64 aspect-[2/3] rounded-lg shadow-2xl border border-white/10 overflow-hidden transform translate-y-10">
                    <BookCover isbn={book.isbn} title={book.title} author={book.author} moodColor={book.moodColor} className="w-full h-full" />
                </div>
                <div className="flex-1 pb-4">
                    <div className="flex gap-2 mb-4">
                        <span className="px-3 py-1 bg-accent-gold/20 text-accent-gold border border-accent-gold/40 rounded text-[10px] font-bold uppercase tracking-widest">{book.genre}</span>
                        {book.atmosphericRole && <span className="px-3 py-1 bg-white/5 text-slate-400 border border-white/10 rounded text-[10px] font-bold uppercase tracking-widest">{book.atmosphericRole} Role</span>}
                    </div>
                    <h2 className="text-4xl md:text-7xl font-serif font-bold text-white mb-4 leading-none">{book.title}</h2>
                    <p className="text-xl md:text-2xl text-slate-400 font-light italic">By {book.author}</p>
                </div>
            </div>
        </div>

        {/* Tab Nav */}
        <div className="flex border-b border-white/5 px-8 md:px-16 sticky top-0 bg-[#0a0a0c]/80 backdrop-blur-xl z-30">
            {['details', 'chat'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`py-6 px-8 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                    {tab === 'details' ? 'The Archive' : 'Character Echo'}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-accent-gold rounded-t-full shadow-[0_0_10px_rgba(212,175,55,0.5)]" />}
                </button>
            ))}
        </div>

        <div className="p-8 md:p-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2 space-y-12">
                {activeTab === 'details' ? (
                    <>
                        {/* Enhanced Metadata Highlights */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white/5 p-6 rounded-xl border border-white/5 hover:border-accent-gold/30 transition-all">
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block mb-2">Cognitive Effort</span>
                                <p className="text-white font-serif text-xl">{book.cognitiveEffort || 'Moderate'}</p>
                            </div>
                            <div className="bg-white/5 p-6 rounded-xl border border-white/5 hover:border-accent-gold/30 transition-all">
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block mb-2">Atmospheric Role</span>
                                <p className="text-white font-serif text-xl">{book.atmosphericRole || 'Immersive'}</p>
                            </div>
                            <div className="bg-white/5 p-6 rounded-xl border border-white/5 hover:border-accent-gold/30 transition-all">
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block mb-2">Sensory Mood</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: book.moodColor }} />
                                    <span className="text-white font-mono text-sm">{book.moodColor}</span>
                                </div>
                            </div>
                        </div>

                        {book.momentFit && (
                            <div className="p-8 bg-accent-gold/5 border-l-4 border-accent-gold rounded-r-xl">
                                <h4 className="text-accent-gold text-xs font-bold uppercase mb-3 tracking-widest">Why it fits this moment</h4>
                                <p className="text-slate-200 text-lg italic font-serif leading-relaxed">"{book.momentFit}"</p>
                            </div>
                        )}

                        <div className="space-y-6">
                            <h3 className="text-3xl font-serif font-bold text-white">The Synopsis</h3>
                            <p className="text-slate-300 text-lg leading-relaxed font-light">{book.description}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {book.musicPairing && (
                                <div className="p-6 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase block mb-3">Soundtrack</span>
                                    <p className="text-slate-200 italic">"{book.musicPairing}"</p>
                                </div>
                            )}
                            {book.moviePairing && (
                                <div className="p-6 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase block mb-3">Cinema Match</span>
                                    <p className="text-slate-200 italic">"{book.moviePairing}"</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <CharacterChat bookTitle={book.title} author={book.author} onClose={() => setActiveTab('details')} />
                )}
            </div>

            <div className="space-y-10">
                <div className="bg-slate-900/50 p-8 rounded-2xl border border-white/5">
                    <h4 className="text-slate-500 text-[10px] font-bold uppercase mb-6 tracking-widest">World Visualization</h4>
                    <MoodVisualizer initialPrompt={`Artistic atmospheric cover for ${book.title}, ${book.genre}, style: cinematic, color: ${book.moodColor}`} />
                </div>
                
                <div className="flex flex-col gap-4">
                    <button onClick={() => onToggleWishlist(book)} className={`py-4 rounded font-bold transition-all border ${isInWishlist ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-white hover:bg-white hover:text-black'}`}>
                        {isInWishlist ? 'Remove from Archive' : 'Add to Archive'}
                    </button>
                    {book.buyLink || book.ebookUrl ? (
                        <a href={book.buyLink || book.ebookUrl} target="_blank" rel="noreferrer" className="py-4 rounded bg-accent-gold text-black text-center font-bold hover:bg-yellow-500 transition-all">
                            Access Full Text
                        </a>
                    ) : null}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
