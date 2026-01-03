
import { GoogleGenAI, Type, Modality, LiveServerMessage, Chat, GenerateContentResponse } from "@google/genai";
import { UserPreferences, Book, CharacterPersona, EnhancedDetails, WebSource, TrainingSignal, SessionHistory, AtmosphericIntelligence, PulseUpdate } from "../types";

const getAi = () => {
  const key = localStorage.getItem('atmosphera_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
  if (!key) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey: key });
};
const SYSTEM_DATE = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

// SENIOR ENGINEER UPGRADE: Persistent Caching Layer
// Instead of just memory, we check localStorage to speed up re-visits.
const getCache = (key: string) => {
  try {
    const item = localStorage.getItem(`atmosphera_cache_${key}`);
    return item ? JSON.parse(item) : null;
  } catch (e) { return null; }
};

const setCache = (key: string, data: any) => {
  try {
    // Limit cache size? For MVP, just saving is fine. browser has 5MB limit.
    localStorage.setItem(`atmosphera_cache_${key}`, JSON.stringify(data));
  } catch (e) { console.warn("Cache quota exceeded"); }
};

const extractJson = (text: string) => {
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON parsing failed", text);
    throw new Error("The literary archives returned an unreadable format.");
  }
};

const LANGUAGE_MAP: Record<string, string> = {
  'English': 'en', 'Hindi': 'hi', 'Marathi': 'mr', 'Gujarati': 'gu', 'Spanish': 'es', 'French': 'fr', 'German': 'de', 'Japanese': 'ja', 'Russian': 'ru', 'Arabic': 'ar', 'Italian': 'it', 'Korean': 'ko', 'Chinese': 'zh', 'Portuguese': 'pt'
};

export const fetchLiteraryPulse = async (language?: string): Promise<PulseUpdate[]> => {
  const lang = language || 'English';
  const prompt = `Identify 4 high-signal literary news updates for today (${SYSTEM_DATE}). Focus on award wins, major releases, or viral literary discussions. Language context: ${lang}. Return as JSON array.`;

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                snippet: { type: Type.STRING },
                url: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["Release", "Award", "Viral", "Event"] }
              },
              required: ["title", "snippet", "url", "type"]
            }
          }
        }
      })
    });

    if (!res.ok) throw new Error("Pulse fetch failed via proxy");
    const response: GenerateContentResponse = await res.json();
    return extractJson(response.candidates?.[0]?.content?.parts?.[0]?.text || "[]");
  } catch (error) {
    console.error("Pulse fetch failed", error);
    return [];
  }
};

export const fetchEnhancedBookDetails = async (book: Book, prefs: UserPreferences | null): Promise<EnhancedDetails> => {
  const cacheKey = `details-${book.title}-${book.author}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const systemInstruction = `You are Atmosphera. Generate accurate, sensory book metadata. Use Search to verify facts. Archive Date: ${SYSTEM_DATE}.`;
  // SENIOR UPGRADE: We explicitly demand "Functional Search URLs" if a direct link is missing.
  // This prevents "dead" links by ensuring the user always lands on a search result page at minimum.
  const prompt = `Generate deep metadata for "${book.title}" by ${book.author}. Include a memorable quote, key themes. 
  CRITICAL FOR FORMATS:
  1. 'ebookUrl': If a specific legit link (Project Gutenberg/Standard Ebooks) exists, use it. OTHERWISE, generate a high-quality Google Search URL: "https://www.google.com/search?q=${encodeURIComponent(book.title + ' ' + book.author)} +filetype:pdf+OR+epub".
  2. 'audiobookUrl': Use a generic Audible search URL: "https://www.audible.com/search?keywords=${encodeURIComponent(book.title + ' ' + book.author)}".
  Do NOT invent fake store links. Safe Search URLs are better than 404s.`;

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          systemInstruction: { parts: [{ text: systemInstruction }] },
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              literaryIdentity: { type: Type.STRING },
              whyFitsNow: { type: Type.ARRAY, items: { type: Type.STRING } },
              commitment: {
                type: Type.OBJECT,
                properties: {
                  attention: { type: Type.STRING, enum: ['low', 'moderate', 'high'] },
                  weight: { type: Type.STRING, enum: ['light', 'moderate', 'heavy'] },
                  pacing: { type: Type.STRING, enum: ['slow', 'steady', 'fast'] }
                },
                required: ["attention", "weight", "pacing"]
              },
              emotionalArc: { type: Type.STRING },
              readWhen: { type: Type.ARRAY, items: { type: Type.STRING } },
              avoidWhen: { type: Type.ARRAY, items: { type: Type.STRING } },
              microSynopsis: { type: Type.STRING },
              atmosphericProfile: {
                type: Type.OBJECT,
                properties: { tone: { type: Type.STRING }, imagery: { type: Type.STRING }, bestTime: { type: Type.STRING } },
                required: ["tone", "imagery", "bestTime"]
              },
              sensoryPairing: {
                type: Type.OBJECT,
                properties: {
                  sound: { type: Type.STRING },
                  scent: { type: Type.STRING },
                  sip: { type: Type.STRING },
                  lighting: { type: Type.STRING }
                },
                required: ["sound", "scent", "sip", "lighting"]
              },
              readDifferentlyInsight: { type: Type.STRING },
              sectionJustification: { type: Type.STRING },
              deepArchive: {
                type: Type.OBJECT,
                properties: { fullSynopsis: { type: Type.STRING }, authorBackground: { type: Type.STRING } },
                required: ["fullSynopsis", "authorBackground"]
              },
              memorableQuote: { type: Type.STRING },
              keyThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
              formats: {
                type: Type.OBJECT,
                properties: {
                  ebookUrl: { type: Type.STRING },
                  audiobookUrl: { type: Type.STRING },
                  graphicNovel: { type: Type.BOOLEAN }
                },
                required: ["ebookUrl", "audiobookUrl"]
              }
            },
            required: ["literaryIdentity", "whyFitsNow", "commitment", "emotionalArc", "readWhen", "avoidWhen", "microSynopsis", "atmosphericProfile", "readDifferentlyInsight", "sectionJustification", "deepArchive", "sensoryPairing", "memorableQuote", "keyThemes", "formats"]
          }
        }
      })
    });

    if (!res.ok) throw new Error("Enhanced details generation failed via secure proxy");
    const response: GenerateContentResponse = await res.json();
    const result = extractJson(response.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Enhancement failed", error);
    throw error;
  }
};

export const searchBooks = async (query: string, language?: string, limit: number = 20): Promise<Book[]> => {
  try {
    const langCode = language ? LANGUAGE_MAP[language] || '' : '';
    const langParam = langCode ? `&langRestrict=${langCode}` : '';
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${limit}&printType=books${langParam}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const data = await res.json();
    return (data.items || []).map((item: any) => {
      const info = item.volumeInfo;
      return {
        title: info.title,
        author: info.authors?.join(', ') || 'Unknown',
        isbn: info.industryIdentifiers?.[0]?.identifier,
        description: info.description || "No description available.",
        genre: info.categories?.[0] || 'General',
        publisher: info.publisher,
        publishedDate: info.publishedDate,
        pageCount: info.pageCount,
        averageRating: info.averageRating,
        moodColor: '#475569',
        atmosphericRole: 'Immersive',
        cognitiveEffort: 'Moderate',
        excerpt: info.description?.substring(0, 100) || '',
        coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:'),
        buyLink: info.infoLink?.replace('http:', 'https:'),
        language: info.language
      } as Book;
    });
  } catch (e) {
    console.error("Search Books failed", e);
    throw e;
  }
};

export const getTrendingBooks = async (context?: string, language?: string): Promise<Book[]> => {
  try {
    const langCode = language ? LANGUAGE_MAP[language] || '' : '';
    const langParam = langCode ? `&langRestrict=${langCode}` : '';
    const query = context || `subject:fiction ${SYSTEM_DATE}`;
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=30&printType=books&orderBy=relevance${langParam}`);
    if (!res.ok) throw new Error("Trending fetch failed");
    const data = await res.json();
    return (data.items || []).map((item: any) => {
      const info = item.volumeInfo;
      return {
        title: info.title,
        author: info.authors?.join(', ') || 'Unknown',
        isbn: info.industryIdentifiers?.[0]?.identifier,
        description: info.description || "",
        genre: info.categories?.[0] || 'General',
        publisher: info.publisher,
        publishedDate: info.publishedDate,
        pageCount: info.pageCount,
        averageRating: info.averageRating,
        moodColor: '#475569',
        atmosphericRole: 'Immersive',
        cognitiveEffort: 'Moderate',
        excerpt: info.description?.substring(0, 100) || '',
        coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:'),
        buyLink: info.infoLink?.replace('http:', 'https:'),
        language: info.language
      } as Book;
    });
  } catch (e) { return []; }
};

export const fetchWebTrendingBooks = async (language?: string): Promise<Book[]> => {
  const ai = getAi();
  const targetLang = language || 'English';
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Identify 15 highly anticipated fiction books for 2025 written in or widely popular in ${targetLang}. List: Title by Author.`,
      config: { tools: [{ googleSearch: {} }] },
    });
    const text = response.text || "";
    const lines = text.split('\n').filter(l => l.includes('by')).map(l => l.replace(/^\d+\.\s*/, '').trim());
    const results = await Promise.all(lines.slice(0, 10).map(line => searchBooks(line, language, 1).catch(() => [])));
    return results.flat();
  } catch (error) { return getTrendingBooks(undefined, language); }
};

export const fetchHiddenGems = async (language?: string): Promise<Book[]> => {
  const ai = getAi();
  const targetLang = language || 'English';
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find 15 cult classic "Hidden Gem" books from ${targetLang} literature. List: Title by Author.`,
      config: { tools: [{ googleSearch: {} }] },
    });
    const text = response.text || "";
    const lines = text.split('\n').filter(l => l.includes('by')).map(l => l.replace(/^\d+\.\s*/, '').trim());
    const results = await Promise.all(lines.slice(0, 10).map(line => searchBooks(line, language, 1).catch(() => [])));
    return results.flat();
  } catch (error) { return []; }
};

export const getCharacterPersona = async (title: string, author: string): Promise<CharacterPersona> => {
  const cacheKey = `persona-${title}-${author}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  const ai = getAi();
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Identify a central character from "${title}" by ${author}. Return JSON: name, greeting, systemInstruction.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: { name: { type: Type.STRING }, greeting: { type: Type.STRING }, systemInstruction: { type: Type.STRING } },
        required: ["name", "greeting", "systemInstruction"]
      }
    }
  });
  const result = extractJson(response.text);
  setCache(cacheKey, result);
  return result;
};

export const createChatSession = (sys: string): Chat => {
  const ai = getAi();
  return ai.chats.create({ model: "gemini-3-flash-preview", config: { systemInstruction: sys + ` Sync Date: ${SYSTEM_DATE}. Be concise.` } });
};

export const generateMoodImage = async (prompt: string): Promise<string> => {
  const ai = getAi();
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("No imagery found.");
};

export const editMoodImage = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = getAi();
  const match = base64Image.match(/^data:(.*?);base64,(.*)$/);
  if (!match) throw new Error("Invalid image format.");
  const mimeType = match[1];
  const data = match[2];
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ inlineData: { data: data, mimeType: mimeType } }, { text: prompt }] },
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
  }
  throw new Error("Alteration failed.");
};

export const generateAudioPreview = async (t: string): Promise<AudioBuffer> => {
  const ai = getAi();
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: t }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
  });
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  function decode(base64: string) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  }
  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  }
  return await decodeAudioData(decode(base64Audio!), audioContext, 24000, 1);
};

export const connectToLiveLibrarian = async (onAudio: (buffer: AudioBuffer) => void, onClose: () => void) => {
  const ai = getAi();
  const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  function encode(bytes: Uint8Array) {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: () => {
        const source = inputAudioContext.createMediaStreamSource(stream);
        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
        scriptProcessor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const int16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
          sessionPromise.then(session => { session.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } }); });
        };
        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);
      },
      onmessage: async (m) => {
        const b64 = m.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (b64) {
          const binaryString = atob(b64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
          const dataInt16 = new Int16Array(bytes.buffer);
          const buffer = outputAudioContext.createBuffer(1, dataInt16.length, 24000);
          const cd = buffer.getChannelData(0);
          for (let i = 0; i < dataInt16.length; i++) cd[i] = dataInt16[i] / 32768.0;
          onAudio(buffer);
        }
      },
      onerror: onClose,
      onclose: onClose,
    },
    config: { responseModalities: [Modality.AUDIO], systemInstruction: `You are Atmosphera's librarian. Helper for ${SYSTEM_DATE}. Keep responses short.` },
  });
  return { disconnect: async () => { const session = await sessionPromise; session.close(); stream.getTracks().forEach(t => t.stop()); } };
};

/**
 * Atmosphera Real-time Intelligence Engine
 * FAST UI rendering focus.
 */
export const getAtmosphericIntelligence = async (
  prefs: UserPreferences,
  history: SessionHistory,
  bookPool: Book[],
  currentShelves: string[],
  localWeather?: string | null
): Promise<AtmosphericIntelligence> => {
  const ai = getAi();
  const poolSummary = bookPool.map(b => `${b.title} by ${b.author}`).join(', ');

  const systemInstruction = `
    You are Atmosphera’s real-time intelligence engine.
    Support FAST UI rendering. API calls are expensive; be concise.
    
    CRITICAL RULES:
    1. DO NOT fetch or invent books.
    2. Rank current book_pool by moment-fit.
    3. If vibe matches are missing, provide one 'additionalDiscoveryQuery' for the system to fetch.
    4. Provide ONE short session narration sentence.
    
    OUTPUT: Strict JSON with session_mood, ranked_books (title, confidence, reason), suppress, read_later, additionalDiscoveryQuery.
  `;

  // Merge User Preference Weather (Manual) with Local Weather (Sensor)
  const weatherContext = localWeather ? `Detected Atmosphere: ${localWeather}` : `Prerefence: ${prefs.weather}`;

  const prompt = `
    CONTEXT: ${weatherContext}, Mood: ${prefs.mood}, Energy: ${prefs.pace}.
    HISTORY: Viewed: ${history.viewed.slice(-3).join(', ')}.
    POOL: ${poolSummary}.
    Analyze and adapt.
  `;

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "gemini-2.0-flash", // Use 2.0 via proxy for stability
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          systemInstruction: { parts: [{ text: systemInstruction }] },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sessionNarration: { type: Type.STRING },
              featuredBookTitle: { type: Type.STRING },
              shelfOrder: { type: Type.ARRAY, items: { type: Type.STRING } },
              intent: {
                type: Type.OBJECT,
                properties: { primary: { type: Type.STRING }, direction: { type: Type.STRING }, tolerance: { type: Type.STRING } },
                required: ["primary", "direction", "tolerance"]
              },
              antiRecommendation: {
                type: Type.OBJECT,
                properties: { title: { type: Type.STRING }, reason: { type: Type.STRING } },
                required: ["title", "reason"]
              },
              readLater: {
                type: Type.OBJECT,
                properties: { title: { type: Type.STRING }, optimalMoment: { type: Type.STRING } },
                required: ["title", "optimalMoment"]
              },
              reorderedPool: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { title: { type: Type.STRING }, rankingReason: { type: Type.STRING }, confidence: { type: Type.STRING, enum: ["High", "Medium", "Exploratory"] } },
                  required: ["title", "rankingReason", "confidence"]
                }
              },
              additionalDiscoveryQuery: { type: Type.STRING }
            },
            required: ["sessionNarration", "featuredBookTitle", "shelfOrder", "intent", "antiRecommendation", "readLater", "reorderedPool"]
          }
        }
      })
    });

    if (!res.ok) throw new Error("Intelligence generation failed via proxy");
    const response: GenerateContentResponse = await res.json();
    return extractJson(response.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
  } catch (error) {
    console.error("Intelligence failed", error);
    throw error;
  }
};

export const getBookRecommendations = async (prefs: UserPreferences, trainingSignals: TrainingSignal[] = []): Promise<{ heading: string, insight: string, antiRecommendation: string, books: Book[], confidence: string }> => {
  // OPTIMIZED FOR SPEED: Removed complex constraints
  const systemInstruction = `You are Atmosphera, a book recommendation engine. Recommend books strictly for Age: ${prefs.age} and Language: ${prefs.language}.`;

  // Reduced fields in prompt to essential ones for speed
  const prompt = `Curate 5 fiction books for Age: ${prefs.age}, Mood: ${prefs.mood}, Weather: ${prefs.weather}, Interest: ${prefs.specificInterest}. FAST JSON response. If public domain, provide 'pdfUrl' (Project Gutenberg etc). IMPORTANT: Provide valid 'isbn' for cover art retrieval.`;

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          systemInstruction: { parts: [{ text: systemInstruction }] },
          // Removed googleSearch tool for significantly faster response
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              heading: { type: Type.STRING },
              insight: { type: Type.STRING },
              antiRecommendation: { type: Type.STRING },
              confidence: { type: Type.STRING, enum: ["High", "Medium", "Experimental"] },
              books: {
                type: Type.ARRAY, items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    author: { type: Type.STRING },
                    isbn: { type: Type.STRING },
                    coverUrl: { type: Type.STRING },
                    genre: { type: Type.STRING },
                    description: { type: Type.STRING },
                    reasoning: { type: Type.STRING },
                    atmosphericRole: { type: Type.STRING },
                    // cognitiveEffort: { type: Type.STRING, enum: ["Light", "Moderate", "Demanding"] }, // Removed
                    moodColor: { type: Type.STRING },
                    // excerpt: { type: Type.STRING }, // Removed lengthy generation
                    language: { type: Type.STRING },
                    pdfUrl: { type: Type.STRING },
                    averageRating: { type: Type.NUMBER }
                  },
                  required: ["title", "author", "reasoning", "moodColor", "genre", "description", "atmosphericRole"]
                }
              }
            },
            required: ["heading", "insight", "antiRecommendation", "confidence", "books"]
          }
        }
      })
    });

    if (!res.ok) throw new Error("Secure Generation Failed");
    const response: GenerateContentResponse = await res.json();
    return extractJson(response.candidates?.[0]?.content?.parts?.[0]?.text || "{}");

  } catch (error) { throw error; }
};
