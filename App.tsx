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
  const [recTitle, setRecTitle] = useState("Just For You");

  // Initial Load
  useEffect(() => {
    setWishlist(getWishlist());
    // Fetch initial trending content silently
    getTrendingBooks().then(setTrending);

    const handleWishlistUpdate = () => setWishlist(getWishlist());
    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    return () => window.removeEventListener('wishlist-updated', handleWishlistUpdate);
  }, []);

  const handleCurateComplete = async (prefs: UserPreferences) => {
    setLoading(true);
    setView('home');
    
    let title = `For a ${prefs.weather} ${prefs.mood} day`;
    if (prefs.language && prefs.language !== 'English') {
      title += ` in ${prefs.language}`;
    }
    setRecTitle(title);

    try {
      const books = await getBookRecommendations(prefs);
      setRecommendations(books);
      // Scroll to recommendations after short delay
      setTimeout(() => {
        const el = document.getElementById('recommendations-row');
        if(el) el.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } catch (err) {
      alert("The spirits are quiet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const books = await searchBooks(query);
      setSearchResults(books);
      // Scroll to search results
      setTimeout(() => {
        const el = document.getElementById('search-row');
        if(el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (e) {
      alert("Could not search.");
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = (book: Book) => setSelectedBook(book);

  if (view === 'curate') {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-4">
        <button 
          onClick={() => setView('home')}
          className="absolute top-6 right-6 text-slate-400 hover:text-white"
        >
          Close
        </button>
        <div className="w-full max-w-4xl">
           <Questionnaire onComplete={handleCurateComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans overflow-x-hidden">
      <Navbar 
        onHome={() => {
            setSearchResults([]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }} 
        onWishlist={() => {
            const el = document.getElementById('wishlist-row');
            if(el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onSearch={handleSearch}
      />

      <Hero 
        onStart={() => setView('curate')} 
        onBrowse={() => {
             const el = document.getElementById('browse-start');
             if(el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      <div className="relative z-10 -mt-24 pb-20 space-y-4" id="browse-start">
        
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
        <div className="mt-20 border-t border-slate-800 pt-10 text-center text-slate-500 text-sm pb-10">
          <p>Powered by Google Gemini 2.5 • Flash, Pro & Imagen</p>
          <p className="mt-2">Atmosphera © 2025</p>
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