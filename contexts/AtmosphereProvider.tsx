
import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchLocalWeather } from '../services/weather';
import { WeatherType } from '../types';

interface AtmosphereContextType {
    weather: WeatherType | null;
    isDay: boolean;
    temperature: number | null;
    loading: boolean;
    refreshAtmosphere: () => Promise<void>;
}

const AtmosphereContext = createContext<AtmosphereContextType>({
    weather: null,
    isDay: true,
    temperature: null,
    loading: true,
    refreshAtmosphere: async () => { },
});

export const useAtmosphere = () => useContext(AtmosphereContext);

export const AtmosphereProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [weather, setWeather] = useState<WeatherType | null>(null);
    const [isDay, setIsDay] = useState(true);
    const [temperature, setTemperature] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshAtmosphere = async () => {
        setLoading(true);
        try {
            const data = await fetchLocalWeather();
            setWeather(data.weather);
            setIsDay(data.isDay);
            setTemperature(data.temperature);

            // Update CSS Variables for global theming
            updateTheme(data.weather, data.isDay);
        } catch (error) {
            console.error("Failed to sync atmosphere:", error);
            // Fallback to time-based defaults
            const hour = new Date().getHours();
            const fallbackIsDay = hour > 6 && hour < 18;
            setIsDay(fallbackIsDay);
            updateTheme(null, fallbackIsDay);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshAtmosphere();
        // Poll every 30 minutes
        const interval = setInterval(refreshAtmosphere, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <AtmosphereContext.Provider value={{ weather, isDay, temperature, loading, refreshAtmosphere }}>
            {children}
        </AtmosphereContext.Provider>
    );
};

// Helper to inject mood variables into CSS
function updateTheme(weather: WeatherType | null, isDay: boolean) {
    const root = document.documentElement;

    // Base Colors
    let bgGradient = isDay
        ? "linear-gradient(to bottom, #e0f7fa, #ffffff)" // Default Day
        : "linear-gradient(to bottom, #0f172a, #000000)"; // Default Night

    let accentColor = isDay ? "#0ea5e9" : "#fbbf24";

    if (weather) {
        switch (weather) {
            case WeatherType.RAINY:
            case WeatherType.STORMY:
                bgGradient = isDay
                    ? "linear-gradient(to bottom, #94a3b8, #cbd5e1)"
                    : "linear-gradient(to bottom, #1e293b, #0f172a)";
                accentColor = "#38bdf8"; // Light Blue
                break;
            case WeatherType.SUNNY:
                bgGradient = isDay
                    ? "linear-gradient(to bottom, #fff7ed, #ffedd5)"
                    : "linear-gradient(to bottom, #0f172a, #000000)";
                accentColor = "#f59e0b"; // Amber
                break;
            case WeatherType.SNOWY:
                bgGradient = isDay
                    ? "linear-gradient(to bottom, #f8fafc, #e2e8f0)"
                    : "linear-gradient(to bottom, #1e293b, #334155)";
                accentColor = "#a5f3fc"; // Cyan
                break;
        }
    }

    root.style.setProperty('--atmosphere-bg', bgGradient);
    root.style.setProperty('--atmosphere-accent', accentColor);
}
