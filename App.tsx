import React, { useState, useEffect } from 'react';
import { Questionnaire } from './components/Questionnaire';
import { BookCard } from './components/BookCard';
import { Button } from './components/Button';
import { getBookRecommendations } from './services/gemini';
import { UserPreferences, Book } from './types';

function App() {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null);

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
  };

  // Intro Screen
  if (!started) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-deep-bg text-white relative overflow-hidden">
        {/* Abstract Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }} />

        <div className="z-10 text-center px-6 max-w-3xl animate-slide-up">
          <h1 className="text-6xl md:text-8xl font-serif font-bold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-500">
            Atmosphera
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 mb-12 font-light leading-relaxed">
            Books are not just stories; they are companions for your current reality. 
            Tell us about your world, and we will find the pages that belong in it.
          </p>
          <Button onClick={() => setStarted(true)} className="text-lg px-10 py-4">
            Begin the Journey
          </Button>
        </div>
      </div>
    );
  }

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-deep-bg text-white px-4">
        <div className="w-16 h-16 border-4 border-slate-700 border-t-accent-gold rounded-full animate-spin mb-8"></div>
        <h2 className="text-2xl font-serif italic text-slate-300 animate-pulse text-center">
          Consulting the archives of feeling...
        </h2>
        {userPrefs && (
           <p className="mt-4 text-slate-500">Matching {userPrefs.mood?.toLowerCase()} vibes with {userPrefs.weather?.toLowerCase()} skies.</p>
        )}
      </div>
    );
  }

  // Results Screen
  if (recommendations.length > 0) {
    return (
      <div className="min-h-screen bg-deep-bg text-white p-6 md:p-12 overflow-x-hidden">
        <header className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in">
          <div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-2">Your Collection</h2>
            <p className="text-slate-400">Curated for a <span className="text-accent-gold">{userPrefs?.weather}</span> day feeling <span className="text-accent-gold">{userPrefs?.mood}</span>.</p>
          </div>
          <Button variant="outline" onClick={handleRestart} className="whitespace-nowrap">
            Start Over
          </Button>
        </header>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {recommendations.map((book, index) => (
            <BookCard key={index} book={book} index={index} />
          ))}
        </div>

        <footer className="max-w-7xl mx-auto mt-20 text-center text-slate-600 text-sm">
          <p>Powered by Google Gemini • Atmosphera © {new Date().getFullYear()}</p>
        </footer>
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-deep-bg text-white px-6 text-center">
        <h2 className="text-3xl font-serif text-red-400 mb-4">Something went wrong</h2>
        <p className="text-slate-400 mb-8 max-w-md">{error}</p>
        <Button onClick={() => handleComplete(userPrefs!)}>Try Again</Button>
        <button onClick={handleRestart} className="mt-6 text-sm text-slate-500 underline hover:text-slate-300">
          Go back to start
        </button>
      </div>
    );
  }

  // Questionnaire Screen
  return (
    <div className="min-h-screen bg-deep-bg text-white flex flex-col">
       <nav className="p-6 md:p-8">
         <span className="font-serif text-xl font-bold tracking-wider text-slate-500">ATMOSPHERA</span>
       </nav>
       <main className="flex-1 flex items-center">
         <Questionnaire onComplete={handleComplete} />
       </main>
    </div>
  );
}

export default App;