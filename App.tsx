
import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { BookRow } from './components/BookRow';
import { BookDetailModal } from './components/BookDetailModal';
import { Questionnaire } from './components/Questionnaire';
import { LiveLibrarian } from './components/LiveLibrarian';
import { BookCard } from './components/BookCard';
import { GenresView } from './components/GenresView';
import { getBookRecommendations, searchBooks, getTrendingBooks, fetchWebTrendingBooks, fetchHiddenGems } from './services/gemini';
import { getWishlist, toggleWishlist, isInWishlist, getTrainingSignals } from './services/storage';
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
    
    // Non-blocking data loading
    const initializeLibrary = async () => {
      setLoading(true); // Initial skeleton state
      setError(null);

      // MIX: Static API Categories + Dynamic "Unlimited" feel keywords
      const dynamicCategories = [
        { name: "Viral Sensations 2025", query: "subject:fiction BookTok 2024 2025" },
        { name: "Cyberpunk & Future", query: "subject:science fiction cyberpunk" },
        { name: "Dark Academia", query: "subject:fiction dark academia" },
        { name: "Heritage & Lore", query: "subject:Indian literature" },
        { name: "Psychological Thrillers", query: "subject:thriller psychological" },
        { name: "Modern Romantasy", query: "subject:fantasy romance" }
      ];

      try {
        // 1. Fire Critical AI requests (2025 Trends & Hidden Gems)
        const trendingPromise = fetchWebTrendingBooks().catch(e => null);
        const gemsPromise = fetchHiddenGems().catch(e => null);

        // 2. Fire Google Books API requests (Volume)
        const shelvesPromise = Promise.all(
          dynamicCategories.map(async (cat) => {
            const books = await getTrendingBooks(cat.query);
            return { title: cat.name, books, isLive: false };
          })
        );

        // 3. Render Static Shelves First (Speed)
        const loadedShelves = await shelvesPromise;
        setShelves(loadedShelves);
        setLoading(false); // UI Interactive

        // 4. Inject AI Content as it arrives (Quality)
        const [trending, gems] = await Promise.all([trendingPromise, gemsPromise]);
        
        setShelves(prev => {
          const newShelves = [...prev];
          
          if (gems && gems.length > 0) {
            newShelves.unshift({ title: "Hidden Gems & Cult Classics", books: gems, isLive: true });
          }
          
          if (trending && trending.length > 0) {
            newShelves.unshift({ title: "2025 Visionaries", books: trending, isLive: true });
            setFeaturedBook(trending[0]); // Feature the top trend
          } else if (prev.length > 0 && prev[0].books.length > 0) {
            setFeaturedBook(prev[0].books[0]); // Fallback feature
          }
          
          return newShelves;
        });

      } catch (err) {
        console.error("Library initialization failed", err);
        setError("Connection unstable. Showing offline archives.");
        setLoading(false);
      }
    };

    initializeLibrary();

    const handleWishlistUpdate = () => setWishlist(getWishlist());
    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    return () => window.removeEventListener('wishlist-updated', handleWishlistUpdate);
  }, []);

  const handleCurateComplete = async (prefs: UserPreferences) => {
    setLoading(true);
    setView('home');
    setCurrentPrefs(prefs);
    setRecTitle(`Scanning the Atmosphere...`);
    setRecommendations([]); 

    try {
      // FETCH TRAINING SIGNALS (The "Train model accordingly" part)
      const signals = getTrainingSignals();
      const result = await getBookRecommendations(prefs, signals);
      
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
      // Use higher limit for search grid to feel unlimited
      const books = await searchBooks(query, false, 40); 
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
             <Questionnaire onComplete={handleCurateComplete} />
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
                isLoading={!featuredBook && loading} // Pass loading state to Hero
            />

            {/* Reduced negative margin from -mt-32 to -mt-16 to prevent overlap */}
            <div className="relative -mt-16 pb-24 space-y-2 min-h-[400px]">
                {error && (
                  <div className="px-12 py-4 bg-red-950/20 border border-red-500/30 text-red-400 rounded-lg mx-12 text-center mb-8">
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

                {/* Only show spinner if absolutely nothing is loaded */}
                {loading && shelves.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
                    <div className="animate-pulse text-accent-gold font-serif italic text-sm">Synchronizing latest archives...</div>
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
