
import React from 'react';
import { PulseUpdate } from '../types';

interface PulseRowProps {
  pulses: PulseUpdate[];
}

export const PulseRow: React.FC<PulseRowProps> = ({ pulses }) => {
  if (!pulses || pulses.length === 0) return null;

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'Release': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Award': return 'bg-accent-gold/10 text-accent-gold border-accent-gold/20';
      case 'Viral': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Event': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="px-6 md:px-12 mb-20 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-xl md:text-2xl text-white font-medium font-serif tracking-widest uppercase">
          The Literary Pulse
        </h2>
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
        <div className="h-[1px] bg-gradient-to-r from-red-500/30 to-transparent flex-1 mt-1"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {pulses.map((pulse, i) => (
          <a 
            key={i} 
            href={pulse.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group block p-6 bg-white/[0.03] border border-white/10 rounded-xl hover:border-accent-gold/50 transition-all duration-500 hover:-translate-y-1"
          >
            <div className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded border mb-4 ${getTypeStyles(pulse.type)}`}>
              {pulse.type}
            </div>
            <h3 className="text-sm font-serif font-bold text-white mb-2 line-clamp-2 group-hover:text-accent-gold transition-colors">
              {pulse.title}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
              {pulse.snippet}
            </p>
            <div className="mt-4 flex items-center text-[10px] text-accent-gold font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              Read Archive <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
