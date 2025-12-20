
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { BookRow } from './components/BookRow';
import { BookDetailModal } from './components/BookDetailModal';
import { Questionnaire } from './components/Questionnaire';
import { LiveLibrarian } from './components/LiveLibrarian';
import { BookCard } from './components/BookCard';
import { getBookRecommendations, getTrendingBooks, fetchWebTrendingBooks, fetchHiddenGems, getAtmosphericIntelligence } from './services/gemini';
import { getWishlist, toggleWishlist, isInWishlist, getTrainingSignals } from './services/storage';
import { UserPreferences, Book, SessionHistory, AtmosphericIntelligence } from './types';

function App() {
  const [view, setView] = useState<'home' | 'curate' | 'search' | 'genres' | 'recommendations'>('home');
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
        { name: "Viral Sensations 2025", query: "subject:fiction BookTok 2024 2025" },
        { name: "Cyberpunk & Future", query: "subject:science fiction cyberpunk" },
        { name: "Dark Academia", query: "subject:fiction dark academia" }
      ];

      try {
        const trendingPromise = fetchWebTrendingBooks().catch(() => []);
        const gemsPromise = fetchHiddenGems().catch(() => []);
        const shelvesPromise = Promise.all(dynamicCategories.map(async (cat) => {
            const books = await getTrendingBooks(cat.query);
            return { title: cat.name, books };
        }));

        const [loadedShelves, trending, gems] = await Promise.all([shelvesPromise, trendingPromise, gemsPromise]);
        
        setShelves([
            ...(trending.length ? [{ title: "2025 Visionaries", books: trending, isLive: true }] : []),
            ...(gems.length ? [{ title: "Hidden Gems", books: gems, isLive: true }] : []),
            ...loadedShelves
        ]);
        
        if (trending.length) setFeaturedBook(trending[0]);
        else if (loadedShelves[0]?.books.length) setFeaturedBook(loadedShelves[0].books[0]);

      } catch (err) {
        setError("Connection unstable.");
      } finally {
        setLoading(false);
      }
    };

    initializeLibrary();
    const handleWishlistUpdate = () => setWishlist(getWishlist());
    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    return () => window.removeEventListener('wishlist-updated', handleWishlistUpdate);
  }, []);

  useEffect(() => {
    if (!currentPrefs || interactionCountRef.current < 2 || isUpdatingIntel.current) return;
    
    const triggerIntelligence = async () => {
        isUpdatingIntel.current = true;
        try {
            const allBooksInShelves = shelves.flatMap(s => s.books);
            const pool = [...recommendations, ...allBooksInShelves].slice(0, 30);
            const intel = await getAtmosphericIntelligence(currentPrefs, sessionHistory, pool, shelves.map(s => s.title));
            setIntelligence(intel);
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
    try {
      const result = await getBookRecommendations(prefs, getTrainingSignals());
      setRecommendations(result.books);
      setRecTitle(result.heading);
      setRecInsight(result.insight);
      trackAction('engaged', result.books[0].title);
      setView('recommendations'); // Switch to focused recommendations view
    } catch (err) {
      setError("AI Curation drifted.");
      setView('home');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white font-sans overflow-x-hidden relative bg-black">
      <Navbar 
        activeView={view === 'genres' ? 'search' : view}
        onHome={() => setView('home')} 
        onSearchClick={() => setView('search')}
        onGenresClick={() => setView('genres')}
        onWishlist={() => { setView('home'); setTimeout(() => document.getElementById('wishlist-row')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
        onSearch={(q) => { trackAction('searchQueries', q); setView('search'); }}
        searchValue={searchInputValue}
        onSearchChange={setSearchInputValue}
      />

      <div className="relative z-10">
        {view === 'curate' ? (
          <div className="pt-32 min-h-screen flex items-center justify-center">
             <Questionnaire onComplete={handleCurateComplete} />
          </div>
        ) : view === 'recommendations' ? (
          /* Focused Recommendations View */
          <div className="pt-40 px-6 md:px-12 pb-32 animate-fade-in">
             <div className="max-w-7xl mx-auto">
                <div className="mb-16">
                   <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-gold/10 border border-accent-gold/20 mb-6">
                      <div className="w-1.5 h-1.5 bg-accent-gold rounded-full animate-pulse"></div>
                      <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-accent-gold">Moment Calibration Success</span>
                   </div>
                   <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">{recTitle}</h1>
                   <p className="text-xl md:text-2xl font-serif italic text-slate-400 max-w-4xl border-l border-accent-gold/30 pl-6 leading-relaxed">
                      "{recInsight}"
                   </p>
                </div>

                {/* Specific recommended books grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                   {recommendations.map((book, idx) => (
                      <div key={idx} className="h-full">
                        <BookCard book={book} index={idx} onClick={() => { trackAction('viewed', book.title); setSelectedBook(book); }} />
                      </div>
                   ))}
                </div>

                <div className="mt-20 pt-20 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                   <div className="max-w-xl">
                      <h3 className="text-lg font-serif font-bold text-white mb-2">Not quite right?</h3>
                      <p className="text-sm text-slate-500">The library spirits can re-calibrate. You can adjust your preferences or explore the broad archives.</p>
                   </div>
                   <div className="flex gap-4">
                      <button onClick={() => setView('curate')} className="px-8 py-3 rounded-full border border-white/10 hover:border-accent-gold text-sm font-bold uppercase tracking-widest transition-all">Adjust Vibe</button>
                      <button onClick={() => setView('home')} className="px-8 py-3 rounded-full bg-white text-black text-sm font-bold uppercase tracking-widest hover:bg-accent-gold transition-all">Return to Library</button>
                   </div>
                </div>
             </div>
          </div>
        ) : view === 'home' && (
          <>
            {intelligence?.sessionNarration && (
                <div className="fixed top-28 left-0 w-full z-40 px-6 md:px-12 animate-fade-in pointer-events-none">
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-full inline-flex items-center gap-3 shadow-2xl">
                        <div className="w-1.5 h-1.5 bg-accent-gold rounded-full animate-pulse"></div>
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-300">
                            {intelligence.sessionNarration}
                        </span>
                    </div>
                </div>
            )}

            <Hero 
                featuredBook={featuredBook}
                onStart={() => setView('curate')} 
                onBrowse={() => setView('genres')}
                onMoreInfo={(b) => { trackAction('viewed', b.title); setSelectedBook(b); }}
                isLoading={!featuredBook && loading}
            />

            <div className="relative -mt-16 pb-24 space-y-2">
                {(intelligence?.antiRecommendation || intelligence?.readLater) && (
                    <div className="px-6 md:px-12 mb-12 animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {intelligence.antiRecommendation && (
                           <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                               </div>
                               <div>
                                   <h4 className="text-[9px] uppercase font-bold tracking-widest text-red-400 opacity-60 mb-1">Neural Guardrail</h4>
                                   <p className="text-xs font-serif italic text-slate-300">
                                       <span className="text-white font-bold">{intelligence.antiRecommendation.title}</span> is likely a poor fit. {intelligence.antiRecommendation.reason}
                                   </p>
                               </div>
                           </div>
                        )}
                        {intelligence.readLater && (
                           <div className="bg-accent-gold/5 border border-accent-gold/20 rounded-xl p-6 flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-accent-gold/10 flex items-center justify-center text-accent-gold shrink-0">
                                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                               </div>
                               <div>
                                   <h4 className="text-[9px] uppercase font-bold tracking-widest text-accent-gold opacity-60 mb-1">Optimized Moment</h4>
                                   <p className="text-xs font-serif italic text-slate-300">
                                       Save <span className="text-white font-bold">{intelligence.readLater.title}</span>. It's best experienced {intelligence.readLater.optimalMoment}.
                                   </p>
                               </div>
                           </div>
                        )}
                    </div>
                )}

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
                    <div className="animate-pulse text-accent-gold font-serif italic text-sm">Syncing...</div>
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
      
      <LiveLibrarian />
    </div>
  );
}

export default App;
