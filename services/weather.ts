
import { WeatherType } from '../types';

interface WeatherData {
    weather: WeatherType;
    temperature: number;
    isDay: boolean;
    locationName?: string;
}

// Source: https://github.com/public-apis/public-apis
// API: Open-Meteo (Free, No API Key required)
// Docs: https://open-meteo.com/

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

async function getCoordinates(): Promise<GeolocationCoordinates> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation not supported"));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => resolve(position.coords),
            (error) => reject(error)
        );
    });
}

/**
 * Reverse Geocoding using BigDataCloud's free client-side API
 * This is also a free public API often used alongside weather apps
 * URL: https://api.bigdatacloud.net/data/reverse-geocode-client
 */
async function getCityName(lat: number, lon: number): Promise<string> {
    try {
        const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
        );
        const data = await response.json();
        // Try to find the most specific locality
        return data.locality || data.city || data.principalSubdivision || "Unknown Location";
    } catch (e) {
        console.warn("Locality lookup failed:", e);
        return "Local Atmosphere";
    }
}

export async function fetchLocalWeather(): Promise<WeatherData> {
    try {
        const coords = await getCoordinates();

        // 1. Fetch Weather from Open-Meteo (Public API)
        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,is_day,weather_code&timezone=auto`
        );

        if (!weatherResponse.ok) throw new Error("Weather service unreachable");

        const weatherData = await weatherResponse.json();
        const current = weatherData.current;
        const code = current.weather_code;
        const isDay = current.is_day === 1;

        // Resolve Weather Type
        const weatherResolver = WMO_CODE_MAP[code] || (() => WeatherType.CLOUDY);
        const weather = weatherResolver(isDay);

        // 2. Fetch Location Name (Optional enrichment)
        const locationName = await getCityName(coords.latitude, coords.longitude);

        return {
            weather,
            temperature: current.temperature_2m,
            isDay,
            locationName
        };

    } catch (error) {
        console.error("Weather fetch failed", error);
        throw error;
    }
}
