import React, { useState } from 'react';
import { Questionnaire } from './components/Questionnaire';
import { BookCard } from './components/BookCard';
import { Button } from './components/Button';
import { LiveLibrarian } from './components/LiveLibrarian';
import { getBookRecommendations, searchBooks } from './services/gemini';
import { UserPreferences, Book } from './types';

function App() {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleComplete = async (prefs: UserPreferences) => {
    setUserPrefs(prefs);
    setLoading(true);
    setError(null);
    try {
      const books = await getBookRecommendations(prefs);
      setRecommendations(books);
    } catch (err) {
      setError("The spirits of the library are quiet today. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setRecommendations([]);
    setUserPrefs(null);
    setStarted(true);
    setError(null);
    setSearchQuery('');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const books = await searchBooks(searchQuery);
      setRecommendations(books);
    } catch (err) {
      setError("Could not find books matching your query.");
    } finally {
      setLoading(false);
    }
  };

  // Aesthetic Background Component
  const StarryBackground = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#0a0a0c] via-[#111116] to-[#0f172a]"></div>
      <div className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] bg-purple-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[10%] right-[5%] w-[30vw] h-[30vw] bg-blue-900/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      {/* Stars */}
      {[...Array(50)].map((_, i) => (
        <div 
          key={i}
          className="absolute bg-white rounded-full opacity-0 animate-[fadeIn_3s_infinite]"
          style={{
            width: Math.random() * 2 + 1 + 'px',
            height: Math.random() * 2 + 1 + 'px',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            animationDelay: Math.random() * 5 + 's',
            animationDuration: Math.random() * 3 + 2 + 's'
          }}
        />
      ))}
    </div>
  );

  // Intro Screen
  if (!started) {
    return (
      <div className="min-h-screen relative overflow-hidden font-sans text-white">
        <StarryBackground />
        
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <div className="mb-8 animate-slide-up">
            <h1 className="text-7xl md:text-9xl font-serif font-medium tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-slate-300 to-slate-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              Atmosphera
            </h1>
            <div className="h-px w-32 bg-accent-gold/50 mx-auto mt-6 mb-2"></div>
            <p className="text-sm uppercase tracking-[0.3em] text-accent-gold/80">Ambient Book Discovery</p>
          </div>

          <p className="max-w-2xl text-lg md:text-xl text-slate-400 font-light leading-relaxed mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Books are portals. We match them to the weather outside your window, 
            the feeling in your heart, and the world you wish to inhabit.
          </p>

          <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
             <Button onClick={() => setStarted(true)} className="text-lg px-12 py-5 bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-md text-white shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all duration-500 hover:scale-105 hover:shadow-[0_0_50px_rgba(212,175,55,0.2)]">
               Enter the Library
             </Button>
          </div>
        </div>
        
        <LiveLibrarian />
      </div>
    );
  }

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-deep-bg text-white px-4 relative">
        <StarryBackground />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 border-t-2 border-l-2 border-accent-gold rounded-full animate-spin mb-8"></div>
          <h2 className="text-3xl font-serif italic text-slate-200 animate-pulse text-center">
            Weaving atmospheric data...
          </h2>
          <p className="mt-4 text-slate-500 font-light tracking-wide">
             Connecting with Gemini AI
          </p>
        </div>
      </div>
    );
  }

  // Results Screen
  if (recommendations.length > 0) {
    return (
      <div className="min-h-screen bg-deep-bg text-white relative">
        <StarryBackground />
        <div className="relative z-10 p-6 md:p-12 overflow-x-hidden">
          <header className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in">
            <div className="flex-1">
              <h2 className="text-5xl font-serif font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500">Curated Collection</h2>
              <p className="text-slate-400 text-lg">
                {userPrefs ? (
                    <>For a <span className="text-accent-gold border-b border-accent-gold/30">{userPrefs.weather}</span> day, 
                    feeling <span className="text-accent-gold border-b border-accent-gold/30">{userPrefs.mood}</span>.</>
                ) : (
                    <>Based on your search for <span className="text-accent-gold border-b border-accent-gold/30">"{searchQuery}"</span>.</>
                )}
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center">
               <form onSubmit={handleSearch} className="relative group">
                 <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search titles or authors..." 
                    className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-full px-5 py-2.5 w-64 text-sm focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-all text-white placeholder-slate-500"
                 />
                 <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-accent-gold transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </button>
               </form>
               <Button variant="outline" onClick={handleRestart} className="whitespace-nowrap backdrop-blur-sm bg-black/20 text-sm py-2.5">
                 Restart Journey
               </Button>
            </div>
          </header>

          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
            {recommendations.map((book, index) => (
              <BookCard key={index} book={book} index={index} />
            ))}
          </div>

          <footer className="max-w-7xl mx-auto mt-24 text-center text-slate-600 text-sm border-t border-slate-800/50 pt-8">
            <p>Powered by Google Gemini 2.5 • Flash, Pro, Live & Imagen</p>
          </footer>
        </div>
        <LiveLibrarian />
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-deep-bg text-white px-6 text-center relative">
        <StarryBackground />
        <div className="relative z-10 max-w-md bg-black/40 backdrop-blur-md p-10 rounded-2xl border border-red-900/30">
          <h2 className="text-4xl font-serif text-red-400 mb-6">Connection Severed</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">{error}</p>
          <Button onClick={() => userPrefs ? handleComplete(userPrefs) : handleSearch({ preventDefault: () => {} } as React.FormEvent)} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-950/30">Try Again</Button>
          <div className="mt-8">
            <button onClick={handleRestart} className="text-sm text-slate-500 hover:text-white transition-colors">
              Return to Entrance
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Questionnaire Screen
  return (
    <div className="min-h-screen bg-deep-bg text-white flex flex-col relative">
       <StarryBackground />
       <div className="relative z-10 flex-1 flex flex-col">
         <nav className="p-6 md:p-8 flex justify-between items-center">
           <span className="font-serif text-2xl font-bold tracking-widest text-slate-500/50 hover:text-accent-gold transition-colors cursor-default">ATMOSPHERA</span>
         </nav>
         <main className="flex-1 flex items-center justify-center">
           <Questionnaire onComplete={handleComplete} />
         </main>
       </div>
       <LiveLibrarian />
    </div>
  );
}

export default App;