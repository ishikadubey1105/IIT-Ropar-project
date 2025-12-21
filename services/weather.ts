
import { WeatherType } from '../types';

interface WeatherData {
    weather: WeatherType;
    temperature: number;
    isDay: boolean;
    locationName?: string;
}

const WMO_CODE_MAP: Record<number, (isDay: boolean) => WeatherType> = {
    0: (isDay) => isDay ? WeatherType.SUNNY : WeatherType.NIGHT, // Clear sky
    1: (isDay) => isDay ? WeatherType.SUNNY : WeatherType.NIGHT, // Mainly clear
    2: () => WeatherType.CLOUDY, // Partly cloudy
    3: () => WeatherType.OVERCAST, // Overcast
    45: () => WeatherType.FOGGY, // Fog
    48: () => WeatherType.FOGGY, // Depositing rime fog
    51: () => WeatherType.RAINY, // Drizzle: Light
    53: () => WeatherType.RAINY, // Drizzle: Moderate
    55: () => WeatherType.RAINY, // Drizzle: Dense intensity
    56: () => WeatherType.RAINY, // Freezing Drizzle: Light
    57: () => WeatherType.RAINY, // Freezing Drizzle: Dense intensity
    61: () => WeatherType.RAINY, // Rain: Slight
    63: () => WeatherType.RAINY, // Rain: Moderate
    65: () => WeatherType.STORMY, // Rain: Heavy intensity
    66: () => WeatherType.RAINY, // Freezing Rain: Light
    67: () => WeatherType.STORMY, // Freezing Rain: Heavy intensity
    71: () => WeatherType.SNOWY, // Snow fall: Slight
    73: () => WeatherType.SNOWY, // Snow fall: Moderate
    75: () => WeatherType.SNOWY, // Snow fall: Heavy intensity
    77: () => WeatherType.SNOWY, // Snow grains
    80: () => WeatherType.RAINY, // Rain showers: Slight
    81: () => WeatherType.RAINY, // Rain showers: Moderate
    82: () => WeatherType.STORMY, // Rain showers: Violent
    85: () => WeatherType.SNOWY, // Snow showers slight
    86: () => WeatherType.SNOWY, // Snow showers heavy
    95: () => WeatherType.STORMY, // Thunderstorm: Slight or moderate
    96: () => WeatherType.STORMY, // Thunderstorm with slight hail
    99: () => WeatherType.STORMY, // Thunderstorm with heavy hail
};

export async function fetchLocalWeather(): Promise<WeatherData> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation not supported"));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;

                    // fetch weather from Open-Meteo (free, no key needed)
                    const response = await fetch(
                        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,is_day,weather_code&timezone=auto`
                    );

                    if (!response.ok) throw new Error("Weather service unreachable");

                    const data = await response.json();
                    const current = data.current;

                    const code = current.weather_code;
                    const isDay = current.is_day === 1;

                    // Resolve Weather Type
                    const weatherResolver = WMO_CODE_MAP[code] || (() => WeatherType.CLOUDY);
                    const weather = weatherResolver(isDay);

                    resolve({
                        weather,
                        temperature: current.temperature_2m,
                        isDay,
                        locationName: "Local Atmosphere" // We could use a reverse geocoding API here if needed
                    });

                } catch (error) {
                    reject(error);
                }
            },
            (error) => {
                reject(error);
            }
        );
    });
}
