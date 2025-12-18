
import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { BookRow } from './components/BookRow';
import { BookDetailModal } from './components/BookDetailModal';
import { Questionnaire } from './components/Questionnaire';
import { LiveLibrarian } from './components/LiveLibrarian';
import { BookCard } from './components/BookCard';
import { GenresView } from './components/GenresView';
import { getBookRecommendations, searchBooks, getTrendingBooks, fetchWebTrendingBooks } from './services/gemini';
import { getWishlist, toggleWishlist, isInWishlist } from './services/storage';
import { UserPreferences, Book } from './types';

function App() {
  const [view, setView] = useState<'home' | 'curate' | 'search' | 'genres'>('home');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [currentPrefs, setCurrentPrefs] = useState<UserPreferences | null>(null);
  
  // Data State
  const [featuredBook, setFeaturedBook] = useState<Book | null>(null);
  const [shelves, setShelves] = useState<{title: string, books: Book[], isLive?: boolean}[]>([]);
  const [wishlist, setWishlist] = useState<Book[]>([]);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [secondaryLoading, setSecondaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(""); 
  const [searchInputValue, setSearchInputValue] = useState(""); 
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [recTitle, setRecTitle] = useState("Curated for You");

  const displayedShelves = useMemo(() => {
    const seen = new Set<string>();
    const markSeen = (b: Book) => seen.add(`${b.title}-${b.author}`.toLowerCase());

    recommendations.forEach(markSeen);
    wishlist.forEach(markSeen);
    if (featuredBook) markSeen(featuredBook);

    return shelves.map(shelf => {
      const uniqueBooks = shelf.books.filter(book => {
        const key = `${book.title}-${book.author}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return { ...shelf, books: uniqueBooks };
    }).filter(shelf => shelf.books.length > 0);
  }, [shelves, recommendations, wishlist, featuredBook]);

  useEffect(() => {
    setWishlist(getWishlist());
    
    const loadContent = async () => {
      setLoading(true);
      setError(null);
      try {
        // STEP 1: LOAD PRIMARY TRENDS (Web Grounded)
        const trending = await fetchWebTrendingBooks();
        if (trending && trending.length > 0) {
          setShelves([{ title: "Global Sensations", books: trending, isLive: true }]);
          setFeaturedBook(trending[0]);
          setLoading(false); // Enable interactive shell immediately
        }

        // STEP 2: LOAD SECONDARY CATEGORIES (Non-blocking)
        setSecondaryLoading(true);
        const staticCategories = [
          { name: "Trending Now", query: "subject:fiction" },
          { name: "Masterpiece Collection", query: "all-time best books classics" },
          { name: "Heritage & Lore", query: "subject:Indian literature" },
          { name: "Suspense & Thrillers", query: "subject:thriller" },
          { name: "Romantic Escapes", query: "subject:romance" },
          { name: "Sci-Fi & Future", query: "subject:science fiction" }
        ];

        const shelfPromises = staticCategories.map(async (cat) => {
          const books = await getTrendingBooks(cat.query);
          return { title: cat.name, books, isLive: false };
        });

        const extraShelves = await Promise.all(shelfPromises);
        setShelves(prev => [...prev, ...extraShelves]);
      } catch (err) {
        console.error("Critical library load failure", err);
        setError("Archives unreachable. Sync error.");
      } finally {
        setLoading(false);
        setSecondaryLoading(false);
      }
    };

    loadContent();

    const handleWishlistUpdate = () => setWishlist(getWishlist());
    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    return () => window.removeEventListener('wishlist-updated', handleWishlistUpdate);
  }, []);

  const handleCurateComplete = async (prefs: UserPreferences) => {
    setLoading(true);
    setView('home');
    setCurrentPrefs(prefs);
    setRecTitle(`Scanning the Atmosphere...`);

    try {
      const result = await getBookRecommendations(prefs);
      setRecommendations(result.books);
      setRecTitle(result.heading);
      
      setTimeout(() => {
        document.getElementById('recommendations-row')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } catch (err: any) {
      setError("AI Curation drifted. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setView('search');
    setLoading(true);
    setSearchQuery(query);
    setSearchInputValue(query); 
    try {
      const books = await searchBooks(query);
      setSearchResults(books);
    } catch (e: any) {
      setError("Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenreSelect = (genre: string) => {
    handleSearch(`subject:${genre}`);
  };

  return (
    <div className="min-h-screen text-white font-sans overflow-x-hidden relative bg-black">
      <Navbar 
        activeView={view === 'genres' ? 'search' : view}
        onHome={() => setView('home')} 
        onSearchClick={() => setView('search')}
        onGenresClick={() => setView('genres')}
        onWishlist={() => {
            if (view !== 'home') setView('home');
            setTimeout(() => document.getElementById('wishlist-row')?.scrollIntoView({ behavior: 'smooth' }), 100);
        }}
        onSearch={handleSearch}
        searchValue={searchInputValue}
        onSearchChange={setSearchInputValue}
      />

      <div className="relative z-10">
        {view === 'curate' ? (
          <div className="pt-32 min-h-screen flex items-center justify-center">
             < Questionnaire onComplete={handleCurateComplete} />
          </div>
        ) : view === 'genres' ? (
          <GenresView onGenreSelect={handleGenreSelect} onBack={() => setView('home')} />
        ) : view === 'search' ? (
          <div className="pt-32 px-6 md:px-16 pb-20 min-h-screen">
             <h1 className="text-3xl font-serif font-bold mb-8">Results for "{searchQuery}"</h1>
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {searchResults.map((book, i) => <BookCard key={i} book={book} index={i} onClick={() => setSelectedBook(book)} />)}
             </div>
             {searchResults.length === 0 && !loading && (
               <p className="text-slate-500 italic text-center py-20">No matching scrolls found.</p>
             )}
          </div>
        ) : (
          <>
            <Hero 
                featuredBook={featuredBook}
                onStart={() => setView('curate')} 
                onBrowse={() => setView('genres')}
                onMoreInfo={setSelectedBook}
            />

            <div className="relative -mt-32 pb-24 space-y-2 min-h-[400px]">
                {error && (
                  <div className="px-12 py-4 bg-red-950/20 border border-red-500/30 text-red-400 rounded-lg mx-12 text-center">
                    {error}
                  </div>
                )}

                {recommendations.length > 0 && (
                  <div id="recommendations-row">
                    <BookRow title={recTitle} books={recommendations} onBookClick={setSelectedBook} isRecommendation={true} />
                  </div>
                )}
                
                {wishlist.length > 0 && (
                  <div id="wishlist-row">
                    <BookRow title="Personal Archive" books={wishlist} onBookClick={setSelectedBook} />
                  </div>
                )}
                
                {displayedShelves.map((shelf, idx) => (
                  <BookRow 
                    key={`${shelf.title}-${idx}`} 
                    title={shelf.title} 
                    books={shelf.books} 
                    onBookClick={setSelectedBook} 
                    isRecommendation={shelf.isLive}
                  />
                ))}

                {(loading || secondaryLoading) && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
                    <div className="animate-pulse text-accent-gold font-serif italic text-sm">Synchronizing Dec 18, 2025 archives...</div>
                  </div>
                )}
            </div>
          </>
        )}
      </div>

      <BookDetailModal 
        book={selectedBook} 
        onClose={() => setSelectedBook(null)} 
        onToggleWishlist={(b) => { toggleWishlist(b); setWishlist(getWishlist()); }}
        isInWishlist={selectedBook ? isInWishlist(selectedBook) : false}
        userPrefs={currentPrefs}
      />
      
      <LiveLibrarian />
    </div>
  );
}

export default App;
