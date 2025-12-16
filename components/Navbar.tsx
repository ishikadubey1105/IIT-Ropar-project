import React, { useState, useEffect, useRef } from 'react';
import { Book } from '../types';
import { getActiveRead } from '../services/storage';
import { BookCover } from './BookCover';

interface NavbarProps {
  onHome: () => void;
  onWishlist: () => void;
  onSearch: (q: string) => void;
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onHome, onWishlist, onSearch, className = '' }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [search, setSearch] = useState('');
  const [activeRead, setActiveRead] = useState<Book | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    // Load initial active read
    setActiveRead(getActiveRead());

    // Listen for updates
    const handleActiveUpdate = () => setActiveRead(getActiveRead());
    window.addEventListener('active-read-updated', handleActiveUpdate);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('active-read-updated', handleActiveUpdate);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(search);
  };

  const handleVoiceSearch = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearch(transcript);
      onSearch(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 flex items-center justify-between px-6 md:px-12 py-6 md:py-8 ${isScrolled ? 'bg-[#0a0a0c]/95 backdrop-blur-md shadow-lg h-24' : 'bg-gradient-to-b from-black/80 to-transparent h-28'} ${className}`}>
      <div className="flex items-center gap-6 md:gap-10">
        <button onClick={onHome} className="text-2xl md:text-3xl font-serif font-bold text-accent-gold tracking-widest hover:scale-105 transition-transform drop-shadow-md">
          ATMOSPHERA
        </button>
        <div className="hidden md:flex gap-8 text-base font-medium text-slate-300">
          <button onClick={onHome} className="hover:text-white transition-colors hover:border-b-2 border-accent-gold pb-1">Home</button>
          <button onClick={onWishlist} className="hover:text-white transition-colors hover:border-b-2 border-accent-gold pb-1">My List</button>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-8">
        {activeRead && (
          <div className="hidden lg:flex items-center gap-4 bg-white/10 rounded-full px-4 py-2 animate-fade-in border border-white/10 hover:border-accent-gold/50 transition-colors cursor-pointer group relative">
             <div className="w-8 h-10 rounded-sm overflow-hidden shadow-sm shrink-0">
               <BookCover 
                 isbn={activeRead.isbn} 
                 title={activeRead.title} 
                 author={activeRead.author} 
                 moodColor={activeRead.moodColor} 
                 showText={false}
                 className="w-full h-full"
               />
             </div>
             
             <div className="flex flex-col">
               <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Reading Now</span>
               <span className="text-sm font-serif text-white max-w-[150px] truncate">{activeRead.title}</span>
             </div>
             
             {/* Tooltip */}
             <div className="absolute top-full mt-2 right-0 w-56 bg-slate-900 border border-slate-700 p-4 rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <p className="text-xs text-slate-400 italic">"Resume where you left off..."</p>
             </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative group flex items-center">
          <input 
            type="text" 
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-black/40 border border-slate-600 rounded-full pl-5 pr-12 py-2.5 w-32 md:w-48 focus:w-64 transition-all duration-300 text-sm text-white focus:outline-none focus:border-accent-gold shadow-inner placeholder-slate-500"
          />
          
          <button
            type="button"
            onClick={handleVoiceSearch}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/10 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:text-accent-gold'}`}
            title="Search by voice"
          >
            {isListening ? (
               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
            ) : (
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            )}
          </button>
        </form>
        
        <div className="w-10 h-10 rounded-full bg-accent-gold text-black font-serif font-bold text-lg flex items-center justify-center shadow-lg hover:bg-white transition-colors cursor-pointer">
           A
        </div>
      </div>
    </nav>
  );
};