import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { BookRow } from './components/BookRow';
import { BookDetailModal } from './components/BookDetailModal';
import { Questionnaire } from './components/Questionnaire';
import { LiveLibrarian } from './components/LiveLibrarian';
import { BookCard } from './components/BookCard';
import { getBookRecommendations, searchBooks, getTrendingBooks } from './services/gemini';
import { getWishlist, toggleWishlist, isInWishlist } from './services/storage';
import { UserPreferences, Book } from './types';

function App() {
  const [view, setView] = useState<'home' | 'curate' | 'search'>('home');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  // Data State
  const [trending, setTrending] = useState<Book[]>([]);
  const [featuredBook, setFeaturedBook] = useState<Book | null>(null);
  const [trendingTitle, setTrendingTitle] = useState("Trending on Atmosphera");
  
  // Collections
  const [newBooks, setNewBooks] = useState<Book[]>([]);
  const [bestsellerBooks, setBestsellerBooks] = useState<Book[]>([]);
  const [selfHelpBooks, setSelfHelpBooks] = useState<Book[]>([]);
  const [romanceBooks, setRomanceBooks] = useState<Book[]>([]);
  const [thrillerBooks, setThrillerBooks] = useState<Book[]>([]);
  const [gothicBooks, setGothicBooks] = useState<Book[]>([]);
  const [scifiBooks, setScifiBooks] = useState<Book[]>([]);
  const [classicBooks, setClassicBooks] = useState<Book[]>([]);
  const [fantasyBooks, setFantasyBooks] = useState<Book[]>([]);
  const [indianBooks, setIndianBooks] = useState<Book[]>([]);

  const [wishlist, setWishlist] = useState<Book[]>([]);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  
  // Search State
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState(""); 
  const [searchInputValue, setSearchInputValue] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recTitle, setRecTitle] = useState("Just For You");
  const [recContext, setRecContext] = useState<{ insight: string, anti: string } | null>(null);
  const [scrollY, setScrollY] = useState(0);

  // Initial Load & Scroll Listener
  useEffect(() => {
    setWishlist(getWishlist());
    
    // Fetch multiple categories
    getTrendingBooks().then(books => {
        setTrending(books);
        // Select a random featured book from trending
        if (books.length > 0) {
            setFeaturedBook(books[Math.floor(Math.random() * books.length)]);
        }
    });
    
    // New Sections
    getTrendingBooks("subject:fiction", true).then(setNewBooks); 
    getTrendingBooks("bestsellers").then(setBestsellerBooks); 
    
    // Specific requests
    getTrendingBooks("subject:self-help").then(setSelfHelpBooks);
    getTrendingBooks("subject:romance").then(setRomanceBooks);
    getTrendingBooks("subject:thriller").then(setThrillerBooks);

    // Existing Sections
    getTrendingBooks("subject:gothic").then(setGothicBooks);
    getTrendingBooks("subject:science fiction").then(setScifiBooks);
    getTrendingBooks("subject:fantasy").then(setFantasyBooks);
    getTrendingBooks("subject:classics").then(setClassicBooks);
    
    // New Indian Dataset Collection
    getTrendingBooks("subject:Indian literature").then(setIndianBooks);

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
    setRecContext(null);
    
    // Default fallback title while loading
    setRecTitle(`Curating for a ${prefs.mood} ${prefs.weather} day...`);

    try {
      // The AI now returns an object { heading, insight, antiRecommendation, books }
      const result = await getBookRecommendations(prefs);
      
      setRecommendations(result.books);
      setRecTitle(result.heading);
      setRecContext({ insight: result.insight, anti: result.antiRecommendation });
      
      setTimeout(() => {
        const el = document.getElementById('recommendations-row');
        if(el) el.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "The spirits are quiet. We could not divine recommendations at this moment. Please try again.");
      setView('search'); 
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setView('search');
    setLoading(true);
    setError(null);
    setSearchQuery(query);
    setSearchInputValue(query); 
    setSearchResults([]); 

    try {
      const books = await searchBooks(query);
      if (books.length === 0) {
          setError("No tomes found matching this inquiry. Perhaps try a different spelling?");
      }
      setSearchResults(books);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Could not find books. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = (book: Book) => setSelectedBook(book);

  const discoveryTags = [
    "Fiction", "Mystery", "Thriller", "Romance", "Fantasy", "Sci-Fi", "Horror", "History", 
    "Biography", "Science", "Psychology", "Philosophy", "Business", "Self-Help", "Poetry"
  ];

  if (view === 'curate') {
    return (
      <div className="min-h-screen relative text-white flex flex-col items-center justify-center p-4">
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

  // --- MAIN RENDER ---

  return (
    <div className="min-h-screen text-white font-sans overflow-x-hidden relative bg-[#0a0a0c]">
      
      <Navbar 
        activeView={view}
        onHome={() => {
            setView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }} 
        onSearchClick={() => {
            setView('search');
            setSearchQuery(""); 
            setSearchInputValue(""); 
            setSearchResults([]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onWishlist={() => {
            if (view !== 'home') setView('home');
            setTimeout(() => {
              const el = document.getElementById('wishlist-row');
              if(el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }}
        onSearch={handleSearch}
        searchValue={searchInputValue}
        onSearchChange={setSearchInputValue}
      />

      <div className="relative z-10">
        
        {/* SEARCH VIEW */}
        {view === 'search' ? (
          <div className="pt-32 px-6 md:px-12 pb-20 min-h-screen animate-fade-in">
             {/* ... Search implementation remains same ... */}
             <div className="flex flex-col items-center md:items-start mb-8 gap-4">
                 <h1 className="text-4xl md:text-5xl font-serif font-bold text-center md:text-left">
                    {searchQuery ? `Results for "${searchQuery}"` : "Discover Archives"}
                 </h1>
                 
                 <div className="w-full max-w-xl relative md:hidden">
                    <input 
                      type="text" 
                      placeholder="Type to search..."
                      value={searchInputValue}
                      onChange={(e) => setSearchInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchInputValue)}
                      className="w-full bg-white/10 border border-slate-600 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-accent-gold shadow-lg"
                    />
                    <button 
                       onClick={() => handleSearch(searchInputValue)}
                       className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white"
                    >
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </button>
                 </div>
             </div>

             {loading && (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-gold"></div>
                    <p className="text-slate-400 font-serif italic">Searching the archives...</p>
                </div>
             )}

             {!loading && searchResults.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
                   {searchResults.map((book, i) => (
                      <div key={i} className="aspect-[2/3]">
                         <BookCard book={book} index={i} onClick={() => handleBookClick(book)} />
                      </div>
                   ))}
                </div>
             )}

             {!loading && !searchResults.length && searchQuery && !error && (
               <div className="text-center py-20 flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                      <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                  <p className="text-xl text-slate-400">No books found matching this inquiry.</p>
                  <button onClick={() => { setSearchQuery(""); setSearchInputValue(""); }} className="mt-4 text-accent-gold hover:underline">Clear Search</button>
               </div>
             )}

             {!loading && !searchResults.length && !searchQuery && (
               <div className="max-w-4xl mx-auto py-8">
                  <p className="text-slate-400 mb-8 text-lg">Select a genre to explore the archives.</p>
                  <div className="flex flex-wrap gap-4">
                    {discoveryTags.map(tag => (
                      <button 
                        key={tag}
                        onClick={() => handleSearch(tag)}
                        className="px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-accent-gold hover:text-black hover:border-accent-gold transition-all duration-300 text-lg font-serif"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
               </div>
             )}

             {error && (
                <div className="text-center py-20 flex flex-col items-center animate-fade-in">
                    <div className="text-4xl mb-4">📜</div>
                    <p className="text-xl text-red-300 mb-6 font-serif">{error}</p>
                    <button 
                        onClick={() => handleSearch(searchQuery || 'Fiction')}
                        className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-600 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
             )}
          </div>
        ) : (
          /* HOME VIEW */
          <>
            <Hero 
                featuredBook={featuredBook}
                onStart={() => {
                    setView('curate');
                    setError(null);
                }} 
                onBrowse={() => {
                    const el = document.getElementById('browse-start');
                    if(el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                onMoreInfo={handleBookClick}
            />

            {/* Negative margin to pull rows up into hero gradient (Netflix Style) */}
            <div className="pb-20 space-y-4 -mt-20 relative z-20" id="browse-start">
                
                {recommendations.length > 0 && (
                <div id="recommendations-row">
                    <div className="px-6 md:px-12 mb-6 animate-fade-in">
                        {recContext && (
                            <div className="max-w-4xl mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-gradient-to-r from-accent-gold/10 to-transparent border-l-4 border-accent-gold">
                                    <h3 className="text-accent-gold text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        Atmospheric Insight
                                    </h3>
                                    <p className="text-slate-200 font-serif italic text-lg opacity-90">"{recContext.insight}"</p>
                                </div>
                                
                                <div className="p-4 rounded-xl bg-gradient-to-r from-red-900/10 to-transparent border-l-4 border-red-500/50">
                                    <h3 className="text-red-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                        Avoid for now
                                    </h3>
                                    <p className="text-slate-300 text-sm opacity-90 leading-relaxed">{recContext.anti}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <BookRow title={recTitle} books={recommendations} onBookClick={handleBookClick} />
                </div>
                )}

                <div id="wishlist-row">
                {wishlist.length > 0 && (
                    <BookRow title="My List" books={wishlist} onBookClick={handleBookClick} />
                )}
                </div>

                <BookRow title={trendingTitle} books={trending} onBookClick={handleBookClick} />

                {newBooks.length > 0 && (
                    <BookRow title="New Releases" books={newBooks} onBookClick={handleBookClick} />
                )}
                
                {indianBooks.length > 0 && (
                    <BookRow title="Indian Heritage & Stories" books={indianBooks} onBookClick={handleBookClick} />
                )}

                {selfHelpBooks.length > 0 && (
                    <BookRow title="Growth & Mindset" books={selfHelpBooks} onBookClick={handleBookClick} />
                )}

                {bestsellerBooks.length > 0 && (
                    <BookRow title="Global Bestsellers" books={bestsellerBooks} onBookClick={handleBookClick} />
                )}
                {romanceBooks.length > 0 && (
                    <BookRow title="Romance & Heartbreak" books={romanceBooks} onBookClick={handleBookClick} />
                )}
                {thrillerBooks.length > 0 && (
                    <BookRow title="Thrillers & Mystery" books={thrillerBooks} onBookClick={handleBookClick} />
                )}
                {fantasyBooks.length > 0 && (
                    <BookRow title="Epic Fantasy" books={fantasyBooks} onBookClick={handleBookClick} />
                )}
                {gothicBooks.length > 0 && (
                    <BookRow title="Gothic & Eerie" books={gothicBooks} onBookClick={handleBookClick} />
                )}
                {scifiBooks.length > 0 && (
                    <BookRow title="Future Worlds" books={scifiBooks} onBookClick={handleBookClick} />
                )}
                {classicBooks.length > 0 && (
                    <BookRow title="Timeless Classics" books={classicBooks} onBookClick={handleBookClick} />
                )}

                <div className="mt-20 border-t border-white/10 pt-10 text-center text-slate-500 text-sm pb-10 bg-black/40 backdrop-blur-sm">
                  <p>Powered by Google Gemini 2.5 • Flash, Pro & Imagen</p>
                  <p className="mt-2">Atmosphera © 2025</p>
                </div>
            </div>
          </>
        )}
      </div>

      <BookDetailModal 
        book={selectedBook} 
        onClose={() => setSelectedBook(null)} 
        onToggleWishlist={(b) => {
            toggleWishlist(b);
            setWishlist(getWishlist());
        }}
        isInWishlist={selectedBook ? isInWishlist(selectedBook) : false}
      />

      <LiveLibrarian />
    </div>
  );
}

export default App;