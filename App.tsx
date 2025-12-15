import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { BookRow } from './components/BookRow';
import { BookDetailModal } from './components/BookDetailModal';
import { Questionnaire } from './components/Questionnaire';
import { LiveLibrarian } from './components/LiveLibrarian';
import { getBookRecommendations, searchBooks, getTrendingBooks } from './services/gemini';
import { getWishlist, toggleWishlist, isInWishlist } from './services/storage';
import { UserPreferences, Book } from './types';

function App() {
  const [view, setView] = useState<'home' | 'curate'>('home');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  // Data State
  const [trending, setTrending] = useState<Book[]>([]);
  const [wishlist, setWishlist] = useState<Book[]>([]);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recTitle, setRecTitle] = useState("Just For You");
  const [scrollY, setScrollY] = useState(0);

  // Initial Load & Scroll Listener
  useEffect(() => {
    setWishlist(getWishlist());
    getTrendingBooks().then(setTrending);

    const handleWishlistUpdate = () => setWishlist(getWishlist());
    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    
    const handleScroll = () => {
      requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistUpdate);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleCurateComplete = async (prefs: UserPreferences) => {
    setLoading(true);
    setError(null);
    setView('home');
    
    let title = `For a ${prefs.weather} ${prefs.mood} day`;
    if (prefs.language && prefs.language !== 'English') {
      title += ` in ${prefs.language}`;
    }
    setRecTitle(title);

    try {
      const books = await getBookRecommendations(prefs);
      setRecommendations(books);
      setTimeout(() => {
        const el = document.getElementById('recommendations-row');
        if(el) el.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "The spirits are quiet. We could not divine recommendations at this moment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const books = await searchBooks(query);
      setSearchResults(books);
      setTimeout(() => {
        const el = document.getElementById('search-row');
        if(el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "We couldn't find that book in the archives. Please check the spelling or try a different query.");
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = (book: Book) => setSelectedBook(book);

  if (view === 'curate') {
    return (
      <div className="min-h-screen relative text-white flex flex-col items-center justify-center p-4">
        {/* Background for Questionnaire */}
        <div className="fixed inset-0 z-0">
             <img 
               src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2400&auto=format&fit=crop" 
               alt="Library Background" 
               className="w-full h-full object-cover opacity-20"
             />
             <div className="absolute inset-0 bg-black/80" />
        </div>

        <button 
          onClick={() => setView('home')}
          className="absolute top-6 right-6 text-slate-400 hover:text-white z-20"
        >
          Close
        </button>
        <div className="w-full max-w-4xl relative z-10">
           <Questionnaire onComplete={handleCurateComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white font-sans overflow-x-hidden relative">
      {/* GLOBAL FIXED BACKGROUND WITH PARALLAX */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2400&auto=format&fit=crop" 
          alt="Atmospheric Library" 
          className="w-full h-full object-cover will-change-transform"
          style={{ 
            transform: `scale(1.1) translateY(${scrollY * 0.05}px)`,
            filter: `brightness(${Math.max(0.4, 1 - scrollY * 0.001)}) blur(${Math.min(scrollY * 0.005, 3)}px)`
          }}
        />
        {/* Dark Overlay to ensure text readability without "blue" tint */}
        <div className="absolute inset-0 bg-black/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />
      </div>

      <Navbar 
        onHome={() => {
            setSearchResults([]);
            setError(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }} 
        onWishlist={() => {
            const el = document.getElementById('wishlist-row');
            if(el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onSearch={handleSearch}
      />

      {/* Main Content Container */}
      <div className="relative z-10">
        <Hero 
            onStart={() => {
                setView('curate');
                setError(null);
            }} 
            onBrowse={() => {
                const el = document.getElementById('browse-start');
                if(el) el.scrollIntoView({ behavior: 'smooth' });
            }}
        />

        <div className="pb-20 space-y-8" id="browse-start">
            
            {/* Error Banner */}
            {error && (
              <div className="mx-6 md:mx-12 mt-8 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center justify-between animate-fade-in backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <span className="text-slate-200 text-sm md:text-base">{error}</span>
                </div>
                <button onClick={() => setError(null)} className="text-slate-400 hover:text-white p-2">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}

            {loading && (
            <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent-gold"></div>
            </div>
            )}

            {searchResults.length > 0 && (
            <div id="search-row">
                <BookRow title="Search Results" books={searchResults} onBookClick={handleBookClick} />
            </div>
            )}

            {recommendations.length > 0 && (
            <div id="recommendations-row">
                <BookRow title={recTitle} books={recommendations} onBookClick={handleBookClick} />
            </div>
            )}

            <div id="wishlist-row">
            {wishlist.length > 0 ? (
                <BookRow title="My List" books={wishlist} onBookClick={handleBookClick} />
            ) : (
                <div className="pl-12 mb-8 text-slate-500 text-sm hidden">Add books to your list to see them here.</div>
            )}
            </div>

            <BookRow title="Trending on Atmosphera" books={trending} onBookClick={handleBookClick} />

            {/* Footer */}
            <div className="mt-20 border-t border-white/10 pt-10 text-center text-slate-500 text-sm pb-10 bg-black/40 backdrop-blur-sm">
              <p>Powered by Google Gemini 2.5 • Flash, Pro & Imagen</p>
              <p className="mt-2">Atmosphera © 2025</p>
            </div>
        </div>
      </div>

      <BookDetailModal 
        book={selectedBook} 
        onClose={() => setSelectedBook(null)} 
        onToggleWishlist={(b) => {
            toggleWishlist(b);
            setWishlist(getWishlist()); // force update
        }}
        isInWishlist={selectedBook ? isInWishlist(selectedBook) : false}
      />

      <LiveLibrarian />
    </div>
  );
}

export default App;