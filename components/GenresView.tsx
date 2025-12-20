
import React from 'react';
import { Button } from './Button';

interface GenresViewProps {
  onGenreSelect: (genre: string) => void;
  onBack: () => void;
}

// Map genres to atmospheric icons
const GenreIcons: Record<string, React.ReactNode> = {
  'Fiction': <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  'Non-fiction': <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  'Mystery': <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  'Sci-Fi': <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 4a2 2 0 114 0v1a2 2 0 11-4 0V4zM4 11a2 2 0 114 0v1a2 2 0 11-4 0v-1zM18 11a2 2 0 114 0v1a2 2 0 11-4 0v-1zM11 18a2 2 0 114 0v1a2 2 0 11-4 0v-1z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 12m-9 0a9 9 0 1 0 18 0 9 9 0 1 0 -18 0" /></svg>,
  'Fantasy': <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>,
  'Romance': <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  'Thriller': <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  'History': <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  'Biography': <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  'Philosophy': <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  'Poetry': <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  'Business': <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  'Gothic': <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m4 0h1m-5 4h1m4 4h1m-5 4h1" /></svg>,
  'Indian Literature': <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 21l-8.228-9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  'Classics': <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>,
  'Adventure': <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};

const GENRES = [
  { name: 'Fiction', color: '#3b82f6', desc: 'Imagined worlds and narratives' },
  { name: 'Non-fiction', color: '#10b981', desc: 'Real-world facts and information' },
  { name: 'Mystery', color: '#6366f1', desc: 'Thrilling puzzles and suspense' },
  { name: 'Sci-Fi', color: '#8b5cf6', desc: 'Futuristic technologies and alien worlds' },
  { name: 'Fantasy', color: '#d946ef', desc: 'Magical realms and epic adventures' },
  { name: 'Romance', color: '#f43f5e', desc: 'Deep emotions and relationships' },
  { name: 'Thriller', color: '#ef4444', desc: 'High stakes and heart-pounding action' },
  { name: 'History', color: '#f59e0b', desc: 'Stories of the past' },
  { name: 'Biography', color: '#78350f', desc: 'Lives of significant people' },
  { name: 'Philosophy', color: '#475569', desc: 'Fundamental questions of existence' },
  { name: 'Poetry', color: '#ec4899', desc: 'Rhythmic and artistic expression' },
  { name: 'Business', color: '#1e40af', desc: 'Economic and professional insights' },
  { name: 'Gothic', color: '#1e1b4b', desc: 'Dark, eerie, and atmospheric tales' },
  { name: 'Indian Literature', color: '#ea580c', desc: 'Rich heritage and local stories' },
  { name: 'Classics', color: '#111827', desc: 'Timeless masterpieces of literature' },
  { name: 'Adventure', color: '#059669', desc: 'Daring journeys and exploration' }
];

export const GenresView: React.FC<GenresViewProps> = ({ onGenreSelect, onBack }) => {
  return (
    <div className="pt-32 px-6 md:px-16 pb-20 min-h-screen animate-fade-in bg-black overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-accent-gold font-bold tracking-[0.4em] text-xs uppercase border border-accent-gold/40 px-4 py-2 bg-black/80 rounded-sm backdrop-blur-xl">
                The Vault
              </span>
              <div className="w-12 h-[1px] bg-accent-gold/30"></div>
            </div>
            <h1 className="text-4xl md:text-7xl font-serif font-bold text-white mb-4 leading-tight tracking-tight">Archives by Genre</h1>
            <p className="text-slate-400 max-w-xl text-lg font-light leading-relaxed">
               Step into the vast corridors of collective human thought. Each genre is a portal to a different facet of the soul.
            </p>
          </div>
          <Button variant="outline" onClick={onBack} className="hidden md:flex group">
            <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Return to Atrium
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {GENRES.map((genre, i) => (
            <button
              key={genre.name}
              onClick={() => onGenreSelect(genre.name)}
              className="group relative h-56 rounded-2xl overflow-hidden text-left transition-all duration-700 hover:scale-[1.02] hover:-translate-y-2 shadow-2xl border border-white/5 animate-slide-up flex flex-col"
              style={{ 
                animationDelay: `${i * 40}ms`, 
                animationFillMode: 'forwards' 
              }}
            >
              {/* Dynamic Multilayer Background */}
              <div 
                className="absolute inset-0 transition-transform duration-1000 group-hover:scale-125" 
                style={{ 
                  background: `radial-gradient(circle at 0% 0%, ${genre.color} 0%, transparent 60%), linear-gradient(to bottom right, #000 0%, ${genre.color}22 100%)`,
                  opacity: 0.8
                }} 
              />
              
              {/* Genre Icon Backdrop */}
              <div className="absolute top-4 right-4 text-white opacity-[0.05] transform group-hover:scale-150 group-hover:rotate-12 transition-all duration-1000 group-hover:opacity-10 pointer-events-none">
                {GenreIcons[genre.name] || GenreIcons['Fiction']}
              </div>

              {/* Glassmorphism Surface */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              
              <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-accent-gold opacity-40 group-hover:opacity-100 transition-opacity"></div>
                   <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40 group-hover:text-accent-gold transition-colors">Section {String(i + 1).padStart(2, '0')}</span>
                </div>
                
                <h3 className="text-3xl font-serif font-bold text-white mb-2 leading-none drop-shadow-md group-hover:text-white transition-colors">
                  {genre.name}
                </h3>
                
                <p className="text-sm text-slate-400 font-light italic opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 line-clamp-2 leading-snug">
                  {genre.desc}
                </p>
              </div>

              {/* Interactive Borders */}
              <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 transition-all duration-700 pointer-events-none rounded-2xl" />
              <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent" />
              
              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-gold group-hover:w-full transition-all duration-700" />
            </button>
          ))}
        </div>
        
        <div className="mt-16 flex justify-center md:hidden">
          <Button variant="outline" onClick={onBack} className="w-full py-4 text-xs tracking-[0.2em] font-bold uppercase border-white/20">
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
};
