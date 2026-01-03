import React, { useState, useRef, useEffect } from 'react';
import { connectToLiveLibrarian } from '../services/gemini';

export const LiveLibrarian: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const disconnectRef = useRef<(() => Promise<void>) | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const toggleSession = async () => {
    setError(null);
    if (isActive) {
      if (disconnectRef.current) await disconnectRef.current();
      setIsActive(false);
      setVolume(0);
      if (audioContextRef.current) audioContextRef.current.close();
      return;
    }

    setIsConnecting(true);
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = audioContextRef.current.currentTime;

      const connection = await connectToLiveLibrarian(
        (audioBuffer) => {
          if (!audioContextRef.current) return;
          const ctx = audioContextRef.current;

          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);

          setVolume(Math.random() * 100);
          setTimeout(() => setVolume(0), audioBuffer.duration * 1000);

          const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
          source.start(startTime);
          nextStartTimeRef.current = startTime + audioBuffer.duration;
        },
        () => {
          setIsActive(false);
          setIsConnecting(false);
        }
      );

      disconnectRef.current = connection.disconnect;
      setIsActive(true);
    } catch (err: any) {
      console.error("Failed to connect live", err);
      setError(err.message || "The librarian is currently unavailable. Please check microphone permissions.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-2">
      {error && (
        <div className="bg-red-950/90 border border-red-500/50 rounded-lg p-3 text-xs text-red-200 mb-2 animate-fade-in backdrop-blur-md shadow-2xl max-w-[240px] text-center">
          {error}
        </div>
      )}
      {isActive && !error && (
        <div className="bg-slate-900/90 border border-accent-gold/50 rounded-lg p-3 text-xs text-accent-gold mb-2 animate-fade-in backdrop-blur-sm shadow-xl max-w-[200px]">
          Listening... Ask about books or just chat about the weather.
        </div>
      )}

      <button
        onClick={toggleSession}
        disabled={isConnecting}
        className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${isActive
            ? 'bg-red-500/20 border-2 border-red-500 text-red-500 animate-pulse'
            : 'bg-accent-gold text-deep-bg hover:scale-110 hover:shadow-accent-gold/40'
          }`}
      >
        {isConnecting ? (
          <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        ) : isActive ? (
          <div className="flex gap-1 items-center justify-center h-full">
            <div className="w-1 bg-red-500 animate-[bounce_1s_infinite]" style={{ height: `${20 + volume / 3}%` }}></div>
            <div className="w-1 bg-red-500 animate-[bounce_1.2s_infinite]" style={{ height: `${30 + volume / 2}%` }}></div>
            <div className="w-1 bg-red-500 animate-[bounce_0.8s_infinite]" style={{ height: `${20 + volume / 3}%` }}></div>
          </div>
        ) : (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
        )}
      </button>
    </div>
  );
};