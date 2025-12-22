

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
  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    if (book) {
      setEnhanced(null);
      setLoadingEnhanced(true);
      fetchEnhancedBookDetails(book, userPrefs)
        .then(setEnhanced)
        .catch(console.error)
        .finally(() => setLoadingEnhanced(false));
    }
  }, [book, userPrefs]);

  if (!book) return null;

  if (isFocusMode && enhanced) {
    return <FocusMode book={book} enhanced={enhanced} onExit={() => setIsFocusMode(false)} />;
  }

  // Derived atmosphere color
  const vibeColor = book.moodColor || '#d4af37';

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto overflow-x-hidden animate-fade-in bg-black">
      {/* Dynamic Cinematic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a0c] to-black opacity-90 z-10" />
        {/* Atmospheric Glow */}
        <div className="absolute top-0 right-0 w-[80vw] h-[80vw] rounded-full blur-[150px] opacity-20 transition-colors duration-1000" style={{ background: vibeColor }} />

        {/* Cover Art Backsplash */}
        <div className="absolute inset-0 opacity-10 blur-3xl scale-110">
          <img
            src={book.coverUrl || `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`}
            alt="Atmosphere"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Content Layer */}
      <div className="relative z-20 min-h-screen flex flex-col items-center">

        {/* Top Navigation Bar */}
        <div className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between sticky top-0 z-50 mix-blend-difference text-white">
          <button onClick={onClose} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-accent-gold transition-colors group">
            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-accent-gold transition-colors">
              <svg className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </div>
            <span>Back to Atrium</span>
          </button>

          <div className="flex items-center gap-6">
            <button
              onClick={() => onToggleWishlist(book)}
              className="text-[10px] font-bold uppercase tracking-[0.2em] hover:text-accent-gold transition-colors"
            >
              {isInWishlist ? '- Remove' : '+ Archive'}
            </button>
            {enhanced && (
              <button
                onClick={() => setIsFocusMode(true)}
                className="bg-white/10 hover:bg-white/20 backdrop-blur px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2 border border-white/10"
              >
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Focus Mode
              </button>
            )}
          </div>
        </div>

        {/* Main Stage */}
        <div className="w-full max-w-7xl mx-auto px-6 pt-10 pb-32 grid grid-cols-1 lg:grid-cols-12 gap-16">

          {/* Left: Artifact Display */}
          <div className="lg:col-span-5 flex flex-col gap-10 sticky top-32">
            <div className="relative aspect-[2/3] w-full max-w-md mx-auto rounded-xl shadow-2xl shadow-black/50 overflow-hidden border border-white/5 group">
              <BookCover isbn={book.isbn} title={book.title} author={book.author} moodColor={book.moodColor} className="w-full h-full transform group-hover:scale-105 transition-transform duration-700" />

              {/* Shimmer Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
              <div className="text-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Rating</div>
                <div className="font-serif text-xl">{book.averageRating || '-'} ★</div>
              </div>
              <div className="text-center border-l border-white/10">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Pages</div>
                <div className="font-serif text-xl">{book.pageCount || '~'}</div>
              </div>
              <div className="text-center border-l border-white/10">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Year</div>
                <div className="font-serif text-xl">{book.publishedDate?.substring(0, 4) || '-'}</div>
              </div>
            </div>
          </div>

          {/* Right: Narrative Intelligence */}
          <div className="lg:col-span-7 space-y-16">

            {/* Header */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-serif font-bold leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
                {book.title}
              </h1>
              <p className="text-xl md:text-2xl font-serif italic text-accent-gold/80">
                by {book.author}
              </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-white/10 flex gap-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'details' ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
              >
                Deep Dive
                {activeTab === 'details' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]" />}
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`pb-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'chat' ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
              >
                Character Resonance
                {activeTab === 'chat' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]" />}
              </button>
            </div>

            {activeTab === 'details' ? (
              <div className="space-y-16 animate-slide-up">

                {/* Synopsis - AVAILABLE IMMEDIATELY */}
                <div className="space-y-6">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 flex items-center gap-4">
                    <span className="w-8 h-[1px] bg-slate-700"></span>
                    Synopsis
                    <span className="w-full h-[1px] bg-slate-700"></span>
                  </h3>
                  <div className="prose prose-invert prose-lg max-w-none font-serif text-slate-400 font-light">
                    {book.description.replace(/(<([^>]+)>)/gi, "")}
                  </div>
                </div>

                {/* Enhanced DNA Analysis - LOADING STATE */}
                {loadingEnhanced ? (
                  <div className="space-y-8 animate-pulse opacity-50">
                    <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 h-32 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                      <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-4">Analysing Literary DNA...</div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-white/[0.02] rounded-xl border border-white/5" />
                      ))}
                    </div>
                  </div>
                ) : enhanced ? (
                  <div className="space-y-16 animate-fade-in">
                    {/* The Hook */}
                    <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-accent-gold/50" />
                      <h3 className="text-[9px] uppercase tracking-widest text-slate-500 mb-4">Why This, Why Now</h3>
                      <p className="font-serif text-lg leading-relaxed text-slate-200 mb-6">
                        "{enhanced.literaryIdentity}"
                      </p>

                      {/* Formats & Themes */}
                      <div className="flex flex-wrap gap-3 items-center border-t border-white/5 pt-4">
                        {enhanced.formats?.ebook && (
                          <span className="px-2 py-1 rounded bg-slate-800/50 text-[10px] uppercase font-bold text-slate-400 border border-white/5 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            E-Book
                          </span>
                        )}
                        {enhanced.formats?.audiobook && (
                          <span className="px-2 py-1 rounded bg-slate-800/50 text-[10px] uppercase font-bold text-slate-400 border border-white/5 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            Audio
                          </span>
                        )}
                        <div className="flex-1" />
                        {enhanced.keyThemes?.map(theme => (
                          <span key={theme} className="text-accent-gold/60 text-[10px] uppercase tracking-wider font-bold">#{theme}</span>
                        ))}
                      </div>
                    </div>

                    {/* Memorable Quote */}
                    {enhanced.memorableQuote && (
                      <div className="relative py-8 text-center px-12">
                        <span className="absolute top-0 left-0 text-6xl font-serif text-white/5">"</span>
                        <p className="font-serif text-2xl italic text-slate-300 leading-relaxed">
                          {enhanced.memorableQuote}
                        </p>
                        <span className="absolute bottom-0 right-0 text-6xl font-serif text-white/5">"</span>
                      </div>
                    )}

                    {/* Sensory Pairing Matrix */}
                    <div className="space-y-6">
                      <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 flex items-center gap-4">
                        <span className="w-8 h-[1px] bg-slate-700"></span>
                        Sensory Experience
                        <span className="w-full h-[1px] bg-slate-700"></span>
                      </h3>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                          { icon: '🎧', title: 'Start with', val: enhanced.sensoryPairing.sound },
                          { icon: '🕯️', title: 'Light a', val: enhanced.sensoryPairing.scent },
                          { icon: '☕', title: 'Prepare', val: enhanced.sensoryPairing.sip },
                          { icon: '💡', title: 'Scene', val: enhanced.sensoryPairing.lighting },
                        ].map((item, i) => (
                          <div key={i} className="group p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-accent-gold/20 transition-all hover:-translate-y-1">
                            <div className="text-2xl mb-3 grayscale group-hover:grayscale-0 transition-all">{item.icon}</div>
                            <div className="text-[9px] uppercase tracking-widest text-slate-600 mb-1">{item.title}</div>
                            <div className="text-xs font-bold text-slate-300 group-hover:text-accent-gold transition-colors">{item.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Footer */}
                    {book.buyLink && (
                      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black to-transparent z-40 pointer-events-none flex justify-center pb-12">
                        <a
                          href={book.buyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pointer-events-auto bg-white text-black px-12 py-4 rounded-full font-bold uppercase tracking-[0.2em] hover:scale-105 transition-transform shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:shadow-[0_0_80px_rgba(255,255,255,0.4)]"
                        >
                          Acquire This Volume
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-10 text-center text-slate-600 font-serif italic">Archive data unavailable.</div>
                )}

              </div>
            ) : (
              <div className="animate-fade-in bg-white/[0.02] border border-white/5 rounded-2xl h-[600px] overflow-hidden">
                <CharacterChat bookTitle={book.title} author={book.author} onClose={() => { }} />
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
