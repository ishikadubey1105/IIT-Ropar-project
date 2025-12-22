
import React from 'react';
import { useAtmosphere } from '../contexts/AtmosphereProvider';
import { WeatherType } from '../types';

export const AtmosphereWidget: React.FC = () => {
    const { weather, isDay, temperature, loading } = useAtmosphere();

    if (loading) return null;

    const weatherIcons: Record<string, string> = {
        [WeatherType.SUNNY]: "☀️",
        [WeatherType.NIGHT]: "🌙",
        [WeatherType.RAINY]: "🌧️",
        [WeatherType.STORMY]: "⛈️",
        [WeatherType.CLOUDY]: "☁️",
        [WeatherType.SNOWY]: "❄️",
        [WeatherType.FOGGY]: "🌫️",
        [WeatherType.WINDY]: "💨",
    };

    const [isOnline, setIsOnline] = React.useState(navigator.onLine);

    React.useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const icon = !isOnline ? "📡" : (weather ? weatherIcons[weather] || "✨" : "✨");
    const label = !isOnline ? "Offline Mode (Cached)" : (weather || "Calibrating...");

    return (
        <div className="fixed top-24 right-6 z-50 animate-fade-in pointer-events-none">
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center gap-3 shadow-xl">
                <span className="text-xl filter drop-shadow-md">{icon}</span>
                <div className="flex flex-col">
                    <span className="text-[10px] text-white/60 uppercase tracking-widest font-bold">Local Atmosphere</span>
                    <span className="text-xs font-serif italic text-white">{label} {temperature ? `• ${temperature}°C` : ''}</span>
                </div>
            </div>
        </div>
    );
};
