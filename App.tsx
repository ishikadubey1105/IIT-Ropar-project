
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
import { getBookRecommendations, getTrendingBooks, fetchWebTrendingBooks, fetchHiddenGems, getAtmosphericIntelligence, searchBooks, fetchLiteraryPulse } from './services/gemini';
import { getWishlist, toggleWishlist, isInWishlist, getTrainingSignals } from './services/storage';
import { UserPreferences, Book, SessionHistory, AtmosphericIntelligence, PulseUpdate } from './types';

function App() {
  const [view, setView] = useState<'home' | 'curate' | 'search' | 'genres' | 'recommendations' | 'lab'>('home');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [currentPrefs, setCurrentPrefs] = useState<UserPreferences | null>(null);
  
  // Intelligence State
  const [intelligence, setIntelligence] = useState<AtmosphericIntelligence | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionHistory>({
    viewed: [],
    skipped: [],
    engaged: [],
    wishlistActions: [],
    searchQueries: []
  });
  const interactionCountRef = useRef(0);
  const isUpdatingIntel = useRef(false);

  // Data State
  const [featuredBook, setFeaturedBook] = useState<Book | null>(null);
  const [shelves, setShelves] = useState<{title: string, books: Book[], isLive?: boolean}[]>([]);
  const [wishlist, setWishlist] = useState<Book[]>([]);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [pulses, setPulses] = useState<PulseUpdate[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInputValue, setSearchInputValue] = useState(""); 
  const [recTitle, setRecTitle] = useState("Curated for You");
  const [recInsight, setRecInsight] = useState("");

  // COMPUTE ADAPTED SHELVES
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

    const seen = new Set<string>();
    const markSeen = (b: Book) => seen.add(`${b.title}-${b.author}`.toLowerCase());
    recommendations.forEach(markSeen);
    wishlist.forEach(markSeen);
    if (featuredBook) markSeen(featuredBook);

    return base.map(shelf => {
      let books = shelf.books.filter(book => {
        const key = `${book.title}-${book.author}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (intelligence?.reorderedPool) {
        books = books.map(b => {
            const intel = intelligence.reorderedPool.find(ip => b.title.toLowerCase().includes(ip.title.toLowerCase()));
            if (intel) return { ...b, reasoning: intel.rankingReason };
            return b;
        });
      }
      return { ...shelf, books };
    }).filter(shelf => shelf.books.length > 0);
  }, [shelves, recommendations, wishlist, featuredBook, intelligence]);

  useEffect(() => {
    setWishlist(getWishlist());
    const initializeLibrary = async () => {
      setLoading(true);
      const dynamicCategories = [
        { name: "Trending Now", query: "subject:fiction BookTok 2025" },
        { name: "Atmospheric Reads", query: "subject:fiction moody atmospheric" }
      ];

      try {
        const lang = currentPrefs?.language || 'English';
        const pulsePromise = fetchLiteraryPulse(lang).catch(() => []);
        const trendingPromise = fetchWebTrendingBooks(lang).catch(() => []);
        const gemsPromise = fetchHiddenGems(lang).catch(() => []);
        const shelvesPromise = Promise.all(dynamicCategories.map(async (cat) => {
            const books = await getTrendingBooks(cat.query, lang);
            return { title: cat.name, books };
        }));

        const [loadedShelves, trending, gems, pulseData] = await Promise.all([shelvesPromise, trendingPromise, gemsPromise, pulsePromise]);
        
        setPulses(pulseData);
        setShelves([
            ...(trending.length ? [{ title: "Global Sensations", books: trending, isLive: true }] : []),
            ...(gems.length ? [{ title: "Hidden Gems", books: gems, isLive: true }] : []),
            ...loadedShelves
        ]);
        
        if (trending.length) setFeaturedBook(trending[0]);
        else if (loadedShelves[0]?.books.length) setFeaturedBook(loadedShelves[0].books[0]);

      } catch (err) {
        setError("Synchronization intermittent.");
      } finally {
        setLoading(false);
      }
    };

    initializeLibrary();
    const handleWishlistUpdate = () => setWishlist(getWishlist());
    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    return () => window.removeEventListener('wishlist-updated', handleWishlistUpdate);
  }, [currentPrefs?.language]);

  useEffect(() => {
    if (!currentPrefs || interactionCountRef.current < 2 || isUpdatingIntel.current) return;
    
    const triggerIntelligence = async () => {
        isUpdatingIntel.current = true;
        try {
            const allBooksInShelves = shelves.flatMap(s => s.books);
            const pool = [...recommendations, ...allBooksInShelves].slice(0, 30);
            const intel = await getAtmosphericIntelligence(currentPrefs, sessionHistory, pool, shelves.map(s => s.title));
            setIntelligence(intel);
            
            // DYNAMIC LIBRARY EXPANSION: Add new books if requested
            if (intel.additionalDiscoveryQuery) {
                const lang = currentPrefs?.language || 'English';
                const newBooks = await searchBooks(intel.additionalDiscoveryQuery, lang);
                if (newBooks.length > 0) {
                   setShelves(prev => [
                      { title: `Discovery: ${intel.additionalDiscoveryQuery}`, books: newBooks, isLive: true },
                      ...prev
                   ]);
                }
            }

            const newFeatured = pool.find(b => b.title === intel.featuredBookTitle);
            if (newFeatured) setFeaturedBook(newFeatured);
            interactionCountRef.current = 0;
        } catch (e) { console.debug(e); } finally { isUpdatingIntel.current = false; }
    };
    triggerIntelligence();
  }, [sessionHistory, currentPrefs, shelves, recommendations]);

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
        setError("Search unavailable, please try again later.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white font-sans overflow-x-hidden relative bg-black">
      <Navbar 
        activeView={view === 'genres' ? 'search' : (view === 'recommendations' ? 'recommendations' : view as any)}
        onHome={() => setView('home')} 
        onSearchClick={() => setView('search')}
        onGenresClick={() => setView('genres')}
        onWishlist={() => { setView('home'); setTimeout(() => document.getElementById('wishlist-row')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
        onSearch={handleSearch}
        searchValue={searchInputValue}
        onSearchChange={setSearchInputValue}
      />

      {error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-slide-up pointer-events-none">
           <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/50 px-6 py-3 rounded-full text-red-200 text-[10px] font-bold uppercase tracking-[0.2em] shadow-2xl flex items-center gap-4 pointer-events-auto">
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
              <button onClick={() => setError(null)} className="ml-2 hover:text-white transition-colors p-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
           </div>
        </div>
      )}

      <div className="relative z-10">
        {view === 'curate' ? (
          <div className="pt-32 min-h-screen flex items-center justify-center">
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
                   <p className="text-lg md:text-xl font-serif italic text-slate-400 max-w-4xl border-l-2 border-accent-gold pl-6 leading-relaxed">
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
                      <p className="text-sm text-slate-500">You can adjust the vibe or return to the main library.</p>
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
                   <p className="text-slate-500 font-serif italic">Results for "{searchInputValue}"</p>
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
                      <p className="text-slate-400 font-serif italic text-lg">No matches found in the current archive context.</p>
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
      
      {/* Neural Lab Quick Access for Admins/Pro users */}
      {view !== 'curate' && view !== 'lab' && (
        <button 
          onClick={() => setView('lab')}
          className="fixed bottom-28 right-8 z-40 bg-slate-900/80 border border-white/10 p-4 rounded-full text-slate-400 hover:text-accent-gold hover:border-accent-gold transition-all backdrop-blur-md shadow-2xl group"
          title="Neural Lab"
        >
          <svg className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
      )}

      <LiveLibrarian />
    </div>
  );
}

export default App;
