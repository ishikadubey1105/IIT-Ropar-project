
import React from 'react';
import { Book, EnhancedDetails } from '../types';
import { BookCover } from './BookCover';

interface FocusModeProps {
  book: Book;
  enhanced: EnhancedDetails;
  onExit: () => void;
}

export const FocusMode: React.FC<FocusModeProps> = ({ book, enhanced, onExit }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-[#050507] text-white flex flex-col items-center justify-center p-8 animate-fade-in overflow-hidden">
      {/* Background Breathing Ambient Glow */}
      <div 
        className="absolute inset-0 opacity-20 blur-[120px] animate-pulse-slow pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 50%, ${book.moodColor}, transparent 70%)` }}
      />
      
      {/* Floating Dust Particles Effect (CSS only) */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute top-1/4 left-1/3 w-1 h-1 bg-white rounded-full animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-2/3 w-1.5 h-1.5 bg-white rounded-full animate-float" style={{ animationDelay: '3s' }} />
          <div className="absolute top-3/4 left-1/4 w-0.5 h-0.5 bg-white rounded-full animate-float" style={{ animationDelay: '5s' }} />
      </div>

      <button 
        onClick={onExit}
        className="absolute top-12 left-12 group flex items-center gap-3 text-slate-500 hover:text-white transition-all uppercase text-[10px] tracking-[0.3em] font-bold"
      >
        <div className="w-8 h-[1px] bg-slate-800 group-hover:w-12 group-hover:bg-accent-gold transition-all"></div>
        Exit Focus
      </button>

      <div className="max-w-4xl w-full flex flex-col md:flex-row items-center gap-16 md:gap-24">
        <div className="w-64 md:w-80 aspect-[2/3] rounded-sm shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/5 overflow-hidden transform hover:scale-105 transition-transform duration-1000">
           <BookCover isbn={book.isbn} title={book.title} author={book.author} moodColor={book.moodColor} className="w-full h-full" />
        </div>

        <div className="flex-1 space-y-12 text-center md:text-left">
           <div>
              <h1 className="text-4xl md:text-7xl font-serif font-bold mb-4 tracking-tight leading-none text-white drop-shadow-2xl">
                {book.title}
              </h1>
              <p className="text-xl md:text-3xl font-serif italic text-accent-gold/80 opacity-90">
                {book.author}
              </p>
           </div>

           <div className="space-y-6">
              <div className="inline-flex items-center gap-4 text-[10px] uppercase tracking-[0.4em] font-bold text-slate-500">
                 <div className="w-2 h-2 rounded-full bg-accent-gold animate-pulse"></div>
                 Atmospheric Essence
              </div>
              <p className="text-xl md:text-2xl font-serif font-light leading-relaxed text-slate-200 italic border-l-2 border-accent-gold/30 pl-8">
                 "{enhanced.microSynopsis}"
              </p>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8">
              {[
                { label: 'Sound', val: enhanced.sensoryPairing.sound },
                { label: 'Scent', val: enhanced.sensoryPairing.scent },
                { label: 'Sip', val: enhanced.sensoryPairing.sip },
                { label: 'Lighting', val: enhanced.sensoryPairing.lighting }
              ].map((item, i) => (
                <div key={i} className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                   <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">{item.label}</div>
                   <div className="text-xs font-medium text-white">{item.val}</div>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="absolute bottom-12 text-center animate-bounce-slow opacity-30">
          <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-slate-400">Deep Immerse</p>
      </div>
    </div>
  );
};
