import React from 'react';

export const LoadingOverlay = () => (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0c]/95 backdrop-blur-sm animate-fade-in text-center px-4">
        <div className="relative">
            <div className="w-20 h-20 border-2 border-accent-gold/20 border-t-accent-gold rounded-full animate-spin mb-8"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-accent-gold rounded-full animate-pulse"></div>
            </div>
        </div>
        <h2 className="text-3xl md:text-4xl font-serif text-white mb-4 tracking-tight">Consulting the Archives</h2>
        <div className="flex flex-col gap-2">
            <p className="text-slate-400 font-serif italic animate-pulse">Running semantic analysis on 20,000+ volumes...</p>
            <p className="text-slate-600 text-xs font-mono uppercase tracking-widest">Model: Gemini-2.0-Flash</p>
        </div>
    </div>
);
