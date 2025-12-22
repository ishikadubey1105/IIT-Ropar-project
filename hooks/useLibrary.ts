import { useState, useEffect, useMemo, useRef } from 'react';
import { Book, AtmosphericIntelligence, PulseUpdate, UserPreferences, SessionHistory } from '../types';
import { getTrendingBooks, fetchWebTrendingBooks, fetchHiddenGems, getAtmosphericIntelligence, fetchLiteraryPulse, searchBooks } from '../services/gemini';
import { getWishlist } from '../services/storage';

export const useLibrary = (currentPrefs: UserPreferences | null, sessionHistory: SessionHistory) => {
    const [shelves, setShelves] = useState<{ title: string, books: Book[], isLive?: boolean }[]>([]);
    const [featuredBook, setFeaturedBook] = useState<Book | null>(null);
    const [recommendations, setRecommendations] = useState<Book[]>([]);
    const [pulses, setPulses] = useState<PulseUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [intelligence, setIntelligence] = useState<AtmosphericIntelligence | null>(null);

    const isUpdatingIntel = useRef(false);

    // Initialize Library Content
    useEffect(() => {
        const initializeLibrary = async () => {
            setLoading(true);
            const dynamicCategories = [
                { name: "Trending Now", query: "subject:fiction best_sellers 2025" },
                { name: "Atmospheric Reads", query: "subject:fiction moody atmospheric literary" },
                { name: "Dark Academia", query: "subject:fiction dark academia mystery secret history" },
                { name: "Cyberpunk & Sci-Fi", query: "subject:fiction cyberpunk sci-fi futurism dystopia" },
            ];

            try {
                const lang = currentPrefs?.language || 'English';

                // Parallel Fetching for Performance
                const [pulseData, trending, gems, ...categoryShelves] = await Promise.all([
                    fetchLiteraryPulse(lang).catch(() => []),
                    fetchWebTrendingBooks(lang).catch(() => []),
                    fetchHiddenGems(lang).catch(() => []),
                    ...dynamicCategories.map(cat => getTrendingBooks(`${cat.query}`, lang))
                ]);

                // Build Hero Pool
                const heroPool = [...trending.slice(0, 5), ...gems.slice(0, 5)];
                if (heroPool.length) setFeaturedBook(heroPool[Math.floor(Math.random() * heroPool.length)]);

                // Build Valid Shelves
                const validShelves = [];
                if (trending.length) validShelves.push({ title: "Global Sensations", books: trending, isLive: true });
                if (gems.length) validShelves.push({ title: "Hidden Gems", books: gems, isLive: true });

                categoryShelves.forEach((books, idx) => {
                    if (books.length) validShelves.push({ title: dynamicCategories[idx].name, books, isLive: true });
                });

                setPulses(pulseData);
                setShelves(validShelves);
            } catch (err) {
                setError("Library synchronization intermittent.");
            } finally {
                setLoading(false);
            }
        };

        initializeLibrary();
    }, [currentPrefs?.language]);

    // Intelligence Engine Trigger
    useEffect(() => {
        if (!currentPrefs || recommendations.length === 0 || isUpdatingIntel.current) return;

        const runIntel = async () => {
            isUpdatingIntel.current = true;
            try {
                const intel = await getAtmosphericIntelligence(currentPrefs, sessionHistory, recommendations, shelves.map(s => s.title));
                setIntelligence(intel);

                // Discovery Injection
                if (intel.additionalDiscoveryQuery) {
                    const newBooks = await searchBooks(intel.additionalDiscoveryQuery, currentPrefs.language);
                    if (newBooks.length) setShelves(prev => [{ title: `Discovery: ${intel.additionalDiscoveryQuery}`, books: newBooks, isLive: true }, ...prev]);
                }
            } catch (e) { console.debug("Intel skipped"); } finally { isUpdatingIntel.current = false; }
        };

        // masked debounce
        const t = setTimeout(runIntel, 2000);
        return () => clearTimeout(t);
    }, [sessionHistory, currentPrefs, recommendations, shelves]);

    return { shelves, featuredBook, recommendations, setRecommendations, pulses, loading, error, intelligence };
};
