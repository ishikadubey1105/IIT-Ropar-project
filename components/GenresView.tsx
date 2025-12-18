
import React from 'react';
import { Button } from './Button';

interface GenresViewProps {
  onGenreSelect: (genre: string) => void;
  onBack: () => void;
}

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
    <div className="pt-32 px-6 md:px-16 pb-20 min-h-screen animate-fade-in bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">Archives by Genre</h1>
            <p className="text-slate-400 max-w-xl">Explore the depths of the library through curated categories. Each shelf holds thousands of possibilities.</p>
          </div>
          <Button variant="outline" onClick={onBack} className="hidden md:flex">Return Home</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {GENRES.map((genre, i) => (
            <button
              key={genre.name}
              onClick={() => onGenreSelect(genre.name)}
              className="group relative h-48 rounded-2xl overflow-hidden text-left transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 shadow-2xl border border-white/5 animate-slide-up"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'forwards' }}
            >
              {/* Decorative Background */}
              <div 
                className="absolute inset-0 transition-transform duration-700 group-hover:scale-110" 
                style={{ 
                  background: `linear-gradient(135deg, ${genre.color} 0%, #000 100%)`,
                  opacity: 0.6
                }} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              
              <div className="relative z-10 p-6 h-full flex flex-col justify-end">
                <span className="text-xs uppercase tracking-[0.2em] text-white/60 mb-1 group-hover:text-accent-gold transition-colors">Shelf</span>
                <h3 className="text-2xl font-serif font-bold text-white mb-2 leading-tight">{genre.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {genre.desc}
                </p>
              </div>

              {/* Spine Effect */}
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-white/5 border-r border-white/10" />
            </button>
          ))}
        </div>
        
        <div className="mt-16 flex justify-center md:hidden">
          <Button variant="outline" onClick={onBack}>Return Home</Button>
        </div>
      </div>
    </div>
  );
};
