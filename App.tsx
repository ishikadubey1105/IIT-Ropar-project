
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { BookRow } from './components/BookRow';
import { BookDetailModal } from './components/BookDetailModal';
import { Questionnaire } from './components/Questionnaire';
import { LiveLibrarian } from './components/LiveLibrarian';
import { BookCard } from './components/BookCard';
import { PulseRow } from './components/PulseRow';
import { NeuralLab } from './components/NeuralLab';
import { GenresView } from './components/GenresView';
import { AtmosphereWidget } from './components/AtmosphereWidget';
import { WeatherEffects } from './components/WeatherEffects';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { VisualSearch } from './components/VisualSearch';
import { useAtmosphere } from './contexts/AtmosphereProvider';
import { useLibrary } from './hooks/useLibrary';
import { UserPreferences, Book, SessionHistory } from './types';
import { getWishlist, toggleWishlist, isInWishlist, getTrainingSignals } from './services/storage';
import { getBookRecommendations, searchBooks } from './services/gemini';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ErrorToast } from './components/ErrorToast';

function App() {
  // Session State
  const [currentPrefs, setCurrentPrefs] = useState<UserPreferences | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionHistory>({
    viewed: [], skipped: [], engaged: [], wishlistActions: [], searchQueries: []
  });
  const interactionCountRef = useRef(0);

  // Refactored Hook Usage
  const { shelves, featuredBook, recommendations, setRecommendations, pulses, loading: libLoading, error: libError, intelligence } = useLibrary(currentPrefs, sessionHistory);

  // UI State
  const [view, setView] = useState<'home' | 'curate' | 'search' | 'genres' | 'recommendations' | 'lab'>('home');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchInputValue, setSearchInputValue] = useState("");
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false); // Local loading for search/actions
  const [error, setError] = useState<string | null>(null);

  // Recommendations UI
  const [recTitle, setRecTitle] = useState("Curated for You");
  const [recInsight, setRecInsight] = useState("");

  // Wishlist State
  const [wishlist, setWishlist] = useState<Book[]>([]);
  useEffect(() => {
    setWishlist(getWishlist());
    const handleUpd = () => setWishlist(getWishlist());
    window.addEventListener('wishlist-updated', handleUpd);
    return () => window.removeEventListener('wishlist-updated', handleUpd);
  }, []);

  // Compute Adapted Shelves (Memoized for Performance)
  // This logic adapts shelf ordering based on AI intelligence
  const adaptedShelves = useMemo(() => {
    let base = shelves;
    if (intelligence?.shelfOrder) {
      base = [...shelves].sort((a, b) => {
        const aIdx = intelligence.shelfOrder.indexOf(a.title);
        const bIdx = intelligence.shelfOrder.indexOf(b.title);
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
      });
    }
    return base;
  }, [shelves, intelligence]);

  const trackAction = (type: keyof SessionHistory, val: string) => {
    setSessionHistory(prev => ({
      ...prev,
      [type]: [...new Set([...prev[type], val])].slice(-10)
    }));
    interactionCountRef.current += 1;
  };

  const handleCurateComplete = async (prefs: UserPreferences) => {
    setLoading(true);
    setCurrentPrefs(prefs);
    setError(null);
    try {
      const result = await getBookRecommendations(prefs, getTrainingSignals());
      setRecommendations(result.books);
      setRecTitle(result.heading);
      setRecInsight(result.insight);
      trackAction('engaged', result.books[0].title);
      setView('recommendations');
    } catch (err) {
      setError("AI Curation drifted.");
      setView('home');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const lang = currentPrefs?.language || 'English';
      const results = await searchBooks(q, lang);
      setSearchResults(results);
      trackAction('searchQueries', q);
      setView('search');
    } catch (e) {
      setError("Search momentarily unavailable. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const [showVisualSearch, setShowVisualSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <AuthProvider>
      <div className="min-h-screen text-white font-sans overflow-x-hidden relative bg-transparent transition-colors duration-1000">
        <WeatherEffects />
        <AtmosphereWidget />
        <AuthModal />

        {showVisualSearch && (
          <VisualSearch
            onResult={(q) => { setShowVisualSearch(false); handleSearch(q); }}
            onClose={() => setShowVisualSearch(false)}
          />
        )}
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

        <Navbar
          activeView={view === 'genres' ? 'search' : (view === 'recommendations' ? 'recommendations' : view as any)}
          onHome={() => setView('home')}
          onSearchClick={() => setView('search')}
          onGenresClick={() => setView('genres')}
          onWishlist={() => { setView('home'); setTimeout(() => document.getElementById('wishlist-row')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
          onSearch={handleSearch}
          searchValue={searchInputValue}
          onSearchChange={setSearchInputValue}
          onSettingsClick={() => setShowSettings(true)}
          onSearchClear={() => {
            setSearchInputValue('');
            setSearchResults([]);
            setView('home');
          }}
        />

        {error && <ErrorToast message={error} onClose={() => setError(null)} />}

        <div className="relative z-10">
          {view === 'curate' ? (
            <div className="pt-32 min-h-screen flex items-center justify-center relative">
              {loading && <LoadingOverlay />}
              <Questionnaire onComplete={handleCurateComplete} />
            </div>
          ) : view === 'recommendations' ? (
            <div className="pt-36 px-6 md:px-12 pb-32 animate-fade-in">
              <div className="max-w-7xl mx-auto">
                <div className="mb-12 border-b border-white/5 pb-12">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 mb-6">
                    <div className="w-1.5 h-1.5 bg-accent-gold rounded-full animate-pulse"></div>
                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-accent-gold">Curated Archive Revealed</span>
                  </div>
                  <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">{recTitle}</h1>
                  <p className="text-lg md:text-xl font-serif italic text-slate-300 max-w-4xl border-l-2 border-accent-gold pl-6 leading-relaxed">
                    "{recInsight}"
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                  {recommendations.map((book, idx) => (
                    <div key={idx} className="h-[450px]">
                      <BookCard book={book} index={idx} onClick={() => { trackAction('viewed', book.title); setSelectedBook(book); }} />
                    </div>
                  ))}
                </div>

                <div className="mt-24 pt-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="max-w-xl text-center md:text-left">
                    <h3 className="text-lg font-serif font-bold text-white mb-2">Refine your search?</h3>
                    <p className="text-sm text-slate-400">You can adjust the vibe or return to the main library.</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setView('curate')} className="px-8 py-3 rounded border border-white/10 hover:border-accent-gold text-xs font-bold uppercase tracking-widest transition-all">Recalibrate</button>
                    <button onClick={() => setView('home')} className="px-8 py-3 rounded bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-accent-gold transition-all">Atrium</button>
                  </div>
                </div>
              </div>
            </div>
          ) : view === 'search' ? (
            <div className="pt-36 px-6 md:px-12 pb-32 animate-fade-in">
              <div className="max-w-7xl mx-auto">
                <div className="mb-12">
                  <h1 className="text-3xl md:text-5xl font-serif font-bold mb-2">Discovery Search</h1>
                  <p className="text-slate-400 font-serif italic">Results for "{searchInputValue}"</p>
                </div>

                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                    {searchResults.map((book, idx) => (
                      <div key={idx} className="h-[450px]">
                        <BookCard book={book} index={idx} onClick={() => { trackAction('viewed', book.title); setSelectedBook(book); }} />
                      </div>
                    ))}
                  </div>
                ) : !loading && (
                  <div className="py-20 text-center border border-white/5 bg-white/[0.02] rounded-2xl">
                    <p className="text-slate-400 font-serif italic text-lg">📚 No books found for "{searchInputValue}"</p>
                    <p className="text-slate-500 text-sm mt-2">Try searching for genres like "Fiction" or "Mystery"</p>
                    <button onClick={() => setView('home')} className="mt-6 text-accent-gold uppercase text-[10px] tracking-widest font-bold">Return to Atrium</button>
                  </div>
                )}
              </div>
            </div>
          ) : view === 'genres' ? (
            <GenresView
              onGenreSelect={(g) => handleSearch(`subject:${g}`)}
              onBack={() => setView('home')}
            />
          ) : view === 'lab' ? (
            <div className="pt-24">
              <NeuralLab />
              <div className="max-w-6xl mx-auto px-6 pb-20">
                <button onClick={() => setView('home')} className="text-slate-500 hover:text-accent-gold transition-colors text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Return to Library
                </button>
              </div>
            </div>
          ) : view === 'home' && (
            <>
              <Hero
                featuredBook={featuredBook}
                featuredBooks={recommendations.length > 0 ? recommendations.slice(0, 5) : (shelves[0]?.books?.slice(0, 5) || [])}
                onStart={() => setView('curate')}
                onBrowse={() => setView('genres')}
                onMoreInfo={(b) => { trackAction('viewed', b.title); setSelectedBook(b); }}
                isLoading={!featuredBook && loading}
              />

              <div className="relative -mt-16 pb-24 space-y-4">
                {/* Session Feedback Bar */}
                {intelligence && (
                  <div className="px-6 md:px-12 mb-8 animate-fade-in">
                    <div className="inline-flex items-center gap-4 bg-accent-gold/5 border border-accent-gold/10 rounded-full px-6 py-3 backdrop-blur-md">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-pulse"></div>
                      <p className="text-xs font-serif italic text-accent-gold/80 leading-none">
                        {intelligence.sessionNarration}
                      </p>
                      <button onClick={() => setView('lab')} className="ml-4 pl-4 border-l border-accent-gold/20 text-[9px] uppercase tracking-widest font-bold text-accent-gold/60 hover:text-accent-gold transition-colors">Tune Model</button>
                    </div>
                  </div>
                )}

                {pulses.length > 0 && <PulseRow pulses={pulses} />}

                {recommendations.length > 0 && (
                  <div id="recommendations-row">
                    <BookRow title={recTitle} books={recommendations} onBookClick={(b) => { trackAction('viewed', b.title); setSelectedBook(b); }} isRecommendation={true} />
                  </div>
                )}

                {wishlist.length > 0 && (
                  <div id="wishlist-row">
                    <BookRow title="Personal Archive" books={wishlist} onBookClick={setSelectedBook} />
                  </div>
                )}

                {adaptedShelves.map((shelf, idx) => (
                  <BookRow
                    key={`${shelf.title}-${idx}`}
                    title={shelf.title}
                    books={shelf.books}
                    onBookClick={(b) => { trackAction('viewed', b.title); setSelectedBook(b); }}
                    isRecommendation={shelf.isLive}
                  />
                ))}

                {loading && shelves.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
                    <div className="animate-pulse text-accent-gold font-serif italic text-sm">Synchronizing Library...</div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onToggleWishlist={(b) => {
            const state = toggleWishlist(b);
            trackAction('wishlistActions', `${state ? 'Saved' : 'Removed'} ${b.title}`);
            setWishlist(getWishlist());
          }}
          isInWishlist={selectedBook ? isInWishlist(selectedBook) : false}
          userPrefs={currentPrefs}
        />

        {/* Floating Action Buttons with Tooltips */}
        <div className="fixed bottom-8 right-8 z-[50] flex flex-col gap-4">
          {/* Visual Search Button */}
          {view !== 'curate' && view !== 'lab' && (
            <div className="relative group">
              <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black/80 backdrop-blur border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Visual Search
              </div>
              <button
                onClick={() => setShowVisualSearch(true)}
                className="bg-accent-gold text-black p-4 rounded-full shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:scale-110 transition-transform hover:shadow-[0_0_50px_rgba(212,175,55,0.5)]"
                aria-label="Open Visual Search"
              >
                <svg className="w-6 h-6 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
            </div>
          )}

          {/* Neural Lab (Admin) */}
          {view !== 'curate' && view !== 'lab' && (
            <div className="relative group">
              <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black/80 backdrop-blur border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Neural Diagnostics
              </div>
              <button
                onClick={() => setView('lab')}
                className="bg-slate-900/80 border border-white/10 p-4 rounded-full text-slate-400 hover:text-accent-gold hover:border-accent-gold transition-all backdrop-blur-md shadow-2xl"
                aria-label="Open Neural Lab"
              >
                <svg className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
            </div>
          )}
        </div>

        <LiveLibrarian />
      </div>
    </AuthProvider >
  );
}

export default App;
