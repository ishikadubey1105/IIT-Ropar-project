
import React, { useRef, useState } from 'react';
import { generateMoodImage } from '../services/gemini';

export const VisualSearch: React.FC<{ onResult: (query: string) => void, onClose: () => void }> = ({ onResult, onClose }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target?.result as string);
        reader.readAsDataURL(file);

        setAnalyzing(true);

        // SIMULATION: Because real Multimodal Vision API requires a backend proxy for binary upload usually,
        // We will simulate the "Vision" analysis for this demo if backend isn't ready.
        // In a real Google-Environment, we would send this to Gemini 1.5 Pro Vision.

        setTimeout(() => {
            setAnalyzing(false);
            onResult(`subject:fiction similar to visual style of the uploaded cover`);
        }, 2500);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fade-in">
            <div className="max-w-md w-full p-6 text-center space-y-8 relative">
                <button onClick={onClose} className="absolute top-0 right-4 text-slate-500 hover:text-white">✕</button>

                <div className="space-y-2">
                    <h2 className="text-2xl font-serif text-white">Visual Resonance</h2>
                    <p className="text-xs text-slate-400 uppercase tracking-widest">Scan a cover to find its atmospheric twin</p>
                </div>

                <div
                    onClick={() => inputRef.current?.click()}
                    className="aspect-square w-64 mx-auto border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-accent-gold transition-colors relative overflow-hidden group"
                >
                    {preview ? (
                        <>
                            <img src={preview} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                            {analyzing && (
                                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
                                    <div className="text-[10px] uppercase tracking-widest text-accent-gold mt-4 animate-pulse">Extracting Vibe...</div>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                            <span className="text-sm text-slate-500 font-medium">Tap to Scan</span>
                        </>
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFile}
                />
            </div>
        </div>
    );
};
