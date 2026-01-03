
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
            <div className={`group ${containerClasses} rounded-full px-4 py-2 flex items-center gap-3 transition-colors duration-500 pointer-events-auto relative cursor-help`}>
                <span className="text-xl filter drop-shadow-sm">{icon}</span>
                <div className="flex flex-col">
                    <span className={`text-[10px] uppercase tracking-widest ${subtextClasses}`}>{location || "Local Atmosphere"}</span>
                    <span className={`text-xs font-serif italic ${mainTextClasses}`}>{label} {temperature ? `• ${temperature}°C` : ''}</span>
                </div>

                {/* Context Tooltip */}
                <div className="absolute right-0 top-full mt-4 w-64 p-4 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl text-left opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none shadow-2xl">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-gold/10 flex items-center justify-center shrink-0">
                            <span className="text-accent-gold text-lg">💡</span>
                        </div>
                        <div>
                            <p className="text-accent-gold text-[10px] font-bold uppercase tracking-widest mb-1">Why we sense this</p>
                            <p className="text-slate-300 text-xs leading-relaxed">
                                Atmosphera calibrates recommendations to your physical reality. A rainy afternoon suggests different reading material than a sunny morning.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
