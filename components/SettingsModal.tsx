
import React, { useState, useEffect } from 'react';

export const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const current = localStorage.getItem('atmosphera_api_key');
        if (current) setApiKey(current);
    }, []);

    const handleSave = () => {
        if (apiKey.trim()) {
            localStorage.setItem('atmosphera_api_key', apiKey.trim());
            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                onClose();
                window.location.reload(); // Reload to flush stale API instances
            }, 1000);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in p-6">
            <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white">✕</button>

            <div className="max-w-md w-full space-y-8">
                <div className="space-y-4 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl mx-auto flex items-center justify-center border border-white/10">
                        <svg className="w-8 h-8 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.545 9H9v1H8v1H6v1H5v-2.5a6 6 0 119.586-5.743zM5 20h14" /></svg>
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-white">System Calibration</h2>
                    <p className="text-slate-400 text-sm">To unlock the Atmospheric Intelligence Engine, establishing a secure neural link via a Google Gemini API Key is required.</p>
                </div>

                <div className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block ml-1">Gemini API Token</label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-accent-gold focus:outline-none transition-colors font-mono text-sm"
                    />
                    <p className="text-[10px] text-slate-500 flex justify-between">
                        <span>Required for AI curation & chat.</span>
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-accent-gold hover:underline">Get Key →</a>
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={!apiKey}
                    className={`w-full py-4 rounded-full font-bold text-black uppercase tracking-widest transition-all ${saved ? 'bg-green-500 scale-95' : 'bg-accent-gold hover:scale-105'}`}
                >
                    {saved ? 'Link Established' : 'Connect System'}
                </button>
            </div>
        </div>
    );
};
