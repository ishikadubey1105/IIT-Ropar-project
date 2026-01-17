

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
        <div className="w-full max-w-[90rem] mx-auto px-6 pt-10 pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left: Artifact Display (Cover) */}
          <div className="lg:col-span-4 flex flex-col gap-10 sticky top-32 h-fit">
            <div className="relative aspect-[2/3] w-full max-w-sm mx-auto rounded-xl shadow-2xl shadow-black/50 overflow-hidden border border-white/5 group">
              <BookCover isbn={book.isbn} title={book.title} author={book.author} moodColor={book.moodColor} className="w-full h-full transform group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-8 max-w-sm mx-auto w-full">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Rating</div>
              <div className="font-serif text-xl">{book.averageRating || '-'} ★</div>

              <div className="text-center border-l border-white/10">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Pages</div>
                <div className="font-serif text-xl">{book.pageCount || '~'}</div>
              </div>

              <div className="text-center border-l border-white/10">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Year</div>
                <div className="font-serif text-xl">{book.publishedDate?.substring(0, 4) || '-'}</div>
              </div>
            </div>

            {/* Direct Download Action Removed */}
          </div>

          {/* Right: Narrative Intelligence */}
          <div className="lg:col-span-8 flex flex-col gap-12">

            {/* Header & Tabs */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-serif font-bold leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
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
            </div>

            {/* Content Area */}
            {activeTab === 'details' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-slide-up">

                {/* Column 1: Synopsis & Key Themes */}
                <div className="space-y-12">
                  <div className="space-y-6">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 flex items-center gap-4">
                      <span className="w-8 h-[1px] bg-slate-700"></span>
                      Synopsis
                    </h3>
                    <div className="prose prose-invert prose-lg max-w-none font-serif text-slate-400 font-light leading-relaxed">
                      {book.description.replace(/(<([^>]+)>)/gi, "")}
                    </div>
                  </div>

                  {enhanced && enhanced.memorableQuote && (
                    <div className="relative py-8 text-center px-6 border-t border-b border-white/5">
                      <p className="font-serif text-xl italic text-slate-300 leading-relaxed">
                        "{enhanced.memorableQuote}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Column 2: Enhanced Analysis */}
                <div className="space-y-8">
                  {loadingEnhanced ? (
                    <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 h-64 relative overflow-hidden animate-pulse">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                      <div className="text-[9px] uppercase tracking-widest text-slate-500">Analysing Literary DNA...</div>
                    </div>
                  ) : enhanced ? (
                    <div className="space-y-8 animate-fade-in">

                      {/* The Hook Card */}
                      <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden group hover:border-accent-gold/20 transition-colors">
                        <div className="absolute top-0 left-0 w-1 h-full bg-accent-gold/50" />
                        <h3 className="text-[9px] uppercase tracking-widest text-slate-500 mb-4">Why This, Why Now</h3>
                        <p className="font-serif text-lg leading-relaxed text-slate-200 mb-6">
                          "{enhanced.literaryIdentity}"
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {enhanced.keyThemes?.map(theme => (
                            <span key={theme} className="text-accent-gold/60 text-[10px] uppercase tracking-wider font-bold bg-accent-gold/5 px-2 py-1 rounded">#{theme}</span>
                          ))}
                        </div>
                      </div>

                      {/* Sensory Matrix */}
                      <div className="space-y-4">
                        <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Sensory Experience</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                            <span className="text-xl grayscale">🎧</span>
                            <div className="text-[9px] uppercase text-slate-600 mt-2">Sound</div>
                            <div className="text-xs font-bold text-slate-300">{enhanced.sensoryPairing.sound}</div>
                          </div>
                          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                            <span className="text-xl grayscale">💡</span>
                            <div className="text-[9px] uppercase text-slate-600 mt-2">Lighting</div>
                            <div className="text-xs font-bold text-slate-300">{enhanced.sensoryPairing.lighting}</div>
                          </div>
                        </div>
                      </div>

                      {/* External Links */}
                      <div className="flex flex-col gap-3">
                        {enhanced.formats?.ebookUrl && (
                          <a href={enhanced.formats.ebookUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-3 rounded bg-slate-800/30 hover:bg-slate-700/50 border border-white/5 hover:border-accent-gold/30 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-all">
                            Read E-Book
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                          </a>
                        )}
                        {/* FALLBACK: Always show audiobook link with dynamic URL */}
                        <a
                          href={enhanced.formats?.audiobookUrl || `https://www.audible.com/search?keywords=${encodeURIComponent(book.title + ' ' + book.author)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-3 rounded bg-slate-800/30 hover:bg-slate-700/50 border border-white/5 hover:border-accent-gold/30 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-all"
                        >
                          Listen Audio
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </a>
                      </div>

                    </div>
                  ) : (
                    <div className="py-10 text-center text-slate-600 font-serif italic">Archive data unavailable.</div>
                  )}
                </div>

              </div>
            ) : (
              <div className="animate-fade-in bg-white/[0.02] border border-white/5 rounded-2xl h-[600px] overflow-hidden">
                <CharacterChat bookTitle={book.title} author={book.author} onClose={() => { }} />
              </div>
            )}

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
        </div>
      </div>
    </div>
  );
};

