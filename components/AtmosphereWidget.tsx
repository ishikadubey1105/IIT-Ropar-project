
import React from 'react';
import { useAtmosphere } from '../contexts/AtmosphereProvider';
import { WeatherType } from '../types';

export const AtmosphereWidget: React.FC = () => {
    const { weather, isDay, temperature, location, loading } = useAtmosphere();

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

    // Dynamic styles based on day/night
    // Day: Darker text on light glass
    // Night: White text on dark glass
    const containerClasses = isDay
        ? "bg-white/30 backdrop-blur-md border border-white/40 text-slate-800 shadow-xl"
        : "bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-xl";

    const subtextClasses = isDay
        ? "text-slate-600 font-bold"
        : "text-white/60 font-bold";

    const mainTextClasses = isDay
        ? "text-slate-900"
        : "text-white";

    return (
        <div className="fixed top-24 right-6 z-50 animate-fade-in pointer-events-none">
            <div className={`${containerClasses} rounded-full px-4 py-2 flex items-center gap-3 transition-colors duration-500`}>
                <span className="text-xl filter drop-shadow-sm">{icon}</span>
                <div className="flex flex-col">
                    <span className={`text-[10px] uppercase tracking-widest ${subtextClasses}`}>{location || "Local Atmosphere"}</span>
                    <span className={`text-xs font-serif italic ${mainTextClasses}`}>{label} {temperature ? `• ${temperature}°C` : ''}</span>
                </div>
            </div>
        </div>
    );
};
