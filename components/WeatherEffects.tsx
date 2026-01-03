
import React, { useEffect, useState } from 'react';
import { useAtmosphere } from '../contexts/AtmosphereProvider';
import { WeatherType } from '../types';

export const WeatherEffects: React.FC = () => {
    const { weather, isDay } = useAtmosphere();
    const [particles, setParticles] = useState<number[]>([]);

    useEffect(() => {
        // Reset particles on weather change
        setParticles(Array.from({ length: 50 }, (_, i) => i));
    }, [weather]);

    if (!weather) return null;

    const renderEffects = () => {
        switch (weather) {
            case WeatherType.SNOWY:
                return (
                    <div className="fixed inset-0 pointer-events-none z-[5]">
                        {particles.map((i) => (
                            <div
                                key={`snow-${i}`}
                                className="absolute text-white/60 animate-fall"
                                style={{
                                    left: `${Math.random() * 100}vw`,
                                    animationDuration: `${Math.random() * 5 + 5}s`,
                                    animationDelay: `${Math.random() * 5}s`,
                                    fontSize: `${Math.random() * 10 + 10}px`,
                                    top: -20
                                }}
                            >
                                ❄️
                            </div>
                        ))}
                    </div>
                );
            case WeatherType.RAINY:
            case WeatherType.STORMY:
                return (
                    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
                        {particles.slice(0, 100).map((i) => (
                            <div
                                key={`rain-${i}`}
                                className="absolute bg-white/40 w-[1px] h-10 animate-rain"
                                style={{
                                    left: `${Math.random() * 100}vw`,
                                    animationDuration: `0.5s`,
                                    animationDelay: `${Math.random()}s`,
                                    top: -50
                                }}
                            />
                        ))}
                    </div>
                );
            case WeatherType.SUNNY:
                if (!isDay) return null;
                // "sm" - Sun Beams or Shimmer
                return (
                    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden mix-blend-overlay">
                        <div className="absolute top-0 right-0 w-[50vh] h-[50vh] bg-orange-400/20 blur-[100px] animate-pulse rounded-full translate-x-1/2 -translate-y-1/2" />
                        <div className="absolute top-0 left-1/4 w-full h-full bg-gradient-to-br from-yellow-100/10 to-transparent transform -rotate-12 pointer-events-none" />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <React.Fragment>
            <style>
                {`
                @keyframes fall {
                    0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
                    10% { opacity: 1; }
                    100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
                }
                @keyframes rain {
                    0% { transform: translateY(-50px); opacity: 0; }
                    10% { opacity: 0.5; }
                    100% { transform: translateY(100vh); opacity: 0; }
                }
                `}
            </style>
            {renderEffects()}
        </React.Fragment>
    );
};
