import React, { useEffect, useState } from 'react';

interface ErrorToastProps {
    message: string;
    onClose: () => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ message, onClose }) => {
    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-slide-up pointer-events-none w-full max-w-sm px-4">
            <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/50 px-6 py-4 rounded-2xl text-red-200 text-xs font-bold uppercase tracking-widest shadow-2xl flex items-center justify-between gap-4 pointer-events-auto">
                <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="leading-relaxed">{message}</span>
                </div>
                <button onClick={onClose} className="hover:bg-red-500/20 p-1.5 rounded-full transition-colors shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>
    );
};
