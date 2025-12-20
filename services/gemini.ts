
import { GoogleGenAI, Type, Modality, LiveServerMessage, Chat, GenerateContentResponse } from "@google/genai";
import { UserPreferences, Book, CharacterPersona, EnhancedDetails, WebSource, TrainingSignal, SessionHistory, AtmosphericIntelligence } from "../types";

// Helper to ensure fresh AI instance
const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// System Date Constant - Grounded in the present moment
const SYSTEM_DATE = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

// Simple session-wide cache
const aiCache = new Map<string, any>();

// Helper to clean and parse JSON
const extractJson = (text: string) => {
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON parsing failed", text);
    throw new Error("The literary archives returned an unreadable format.");
  }
};

/**
 * Atmospheric Intelligence Engine
 * Re-ranks the current book pool based on session behavior.
 */
export const getAtmosphericIntelligence = async (
  prefs: UserPreferences,
  history: SessionHistory,
  bookPool: Book[],
  currentShelves: string[]
): Promise<AtmosphericIntelligence> => {
  const ai = getAi();
  
  const poolTitles = bookPool.map(b => `${b.title} by ${b.author}`);

  const systemInstruction = `
    You are Atmosphera’s central intelligence engine.
    You operate like a premium streaming platform’s personalization system.
    
    GOALS:
    - Maximize relevance with limited data.
    - Adapt recommendations during a session.
    - Avoid repetition.
    - Working ONLY with the provided book_pool. Do NOT fetch new books.
  `;

  const prompt = `
    USER CONTEXT:
    - Weather: ${prefs.weather}
    - Mood: ${prefs.mood}
    - Pace: ${prefs.pace}
    
    SESSION SIGNALS:
    - Viewed: ${history.viewed.join(', ')}
    - Skipped: ${history.skipped.join(', ')}
    - Engaged: ${history.engaged.join(', ')}
    - Wishlist: ${history.wishlistActions.join(', ')}
    - Search Queries: ${history.searchQueries.join(', ')}

    BOOK POOL:
    ${poolTitles.join('\n')}

    EXISTING SHELVES:
    ${currentShelves.join(', ')}

    Analyze intent and re-rank the pool.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sessionNarration: { type: Type.STRING },
            featuredBookTitle: { type: Type.STRING },
            shelfOrder: { type: Type.ARRAY, items: { type: Type.STRING } },
            intent: {
                type: Type.OBJECT,
                properties: {
                    primary: { type: Type.STRING },
                    direction: { type: Type.STRING },
                    tolerance: { type: Type.STRING }
                },
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
                properties: {
                  title: { type: Type.STRING },
                  rankingReason: { type: Type.STRING },
                  confidence: { type: Type.STRING, enum: ["High", "Medium", "Exploratory"] }
                },
                required: ["title", "rankingReason", "confidence"]
              }
            }
          },
          required: ["sessionNarration", "featuredBookTitle", "shelfOrder", "intent", "antiRecommendation", "readLater", "reorderedPool"]
        }
      }
    });

    return extractJson(response.text);
  } catch (error) {
    console.error("Intelligence engine failure", error);
    throw error;
  }
};

// --- EXISTING METHODS REMAIN (Modified for speed or caching) ---

export const getBookRecommendations = async (prefs: UserPreferences, trainingSignals: TrainingSignal[] = []): Promise<{ heading: string, insight: string, antiRecommendation: string, books: Book[], confidence: string }> => {
  const ai = getAi();
  
  let trainingContext = "";
  if (trainingSignals.length > 0) {
    const positive = trainingSignals.filter(s => s.feedbackType === 'positive').map(s => `"${s.bookTitle}" (${s.contextNote})`);
    const negative = trainingSignals.filter(s => s.feedbackType === 'negative').map(s => `"${s.bookTitle}" (${s.contextNote})`);
    
    trainingContext = `
      USER PREFERENCE LAB DATA:
      - POSITIVE: ${positive.join('; ') || 'None'}.
      - NEGATIVE: ${negative.join('; ') || 'None'}.
    `;
  }

  const systemInstruction = `
    You are Atmosphera, a deep-reasoning book recommendation engine.
    Archival Date: ${SYSTEM_DATE}.
    STRICT CONSTRAINT: All descriptions must be cinematic and sensory.
  `;

  const prompt = `
    ENVIRONMENTAL INPUT:
    - Weather: ${prefs.weather}
    - Mood: ${prefs.mood}
    - Pace: ${prefs.pace}
    - Setting: ${prefs.setting}
    - Interest: ${prefs.specificInterest || 'Curate the absolute best atmosphere'}

    ${trainingContext}

    Curate 5 books that match these atmospheric vectors.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 32768 }, 
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                heading: { type: Type.STRING },
                insight: { type: Type.STRING },
                antiRecommendation: { type: Type.STRING },
                confidence: { type: Type.STRING, enum: ["High", "Medium", "Experimental"] },
                books: { 
                  type: Type.ARRAY, 
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      author: { type: Type.STRING },
                      isbn: { type: Type.STRING },
                      genre: { type: Type.STRING },
                      description: { type: Type.STRING },
                      reasoning: { type: Type.STRING },
                      atmosphericRole: { type: Type.STRING },
                      cognitiveEffort: { type: Type.STRING, enum: ["Light", "Moderate", "Demanding"] },
                      moodColor: { type: Type.STRING },
                      excerpt: { type: Type.STRING }
                    },
                    required: ["title", "author", "reasoning", "moodColor", "genre", "description", "excerpt", "atmosphericRole", "cognitiveEffort"]
                  }
                }
            },
            required: ["heading", "insight", "antiRecommendation", "confidence", "books"]
        },
      }
    });
    
    return extractJson(response.text);
  } catch (error) {
    console.error("Recommendations failure", error);
    throw error;
  }
};

export const fetchEnhancedBookDetails = async (book: Book, prefs: UserPreferences | null): Promise<EnhancedDetails> => {
  const cacheKey = `details-${book.title}-${book.author}`;
  if (aiCache.has(cacheKey)) return aiCache.get(cacheKey);

  const ai = getAi();
  const systemInstruction = `You are Atmosphera. Generate accurate, grounded book metadata for ${SYSTEM_DATE}. Use Search to verify facts.`;
  const prompt = `Generate deep metadata for "${book.title}" by ${book.author}. Sync for ${SYSTEM_DATE}.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
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
            readDifferentlyInsight: { type: Type.STRING },
            sectionJustification: { type: Type.STRING },
            deepArchive: {
              type: Type.OBJECT,
              properties: { fullSynopsis: { type: Type.STRING }, authorBackground: { type: Type.STRING } },
              required: ["fullSynopsis", "authorBackground"]
            }
          },
          required: ["literaryIdentity", "whyFitsNow", "commitment", "emotionalArc", "readWhen", "avoidWhen", "microSynopsis", "atmosphericProfile", "readDifferentlyInsight", "sectionJustification", "deepArchive"]
        }
      }
    });
    const result = extractJson(response.text);
    aiCache.set(cacheKey, result);
    return result;
  } catch (error) {
    throw error;
  }
};

export const searchBooks = async (query: string, enhance: boolean = false, limit: number = 20): Promise<Book[]> => {
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${limit}&printType=books`); 
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
            buyLink: info.infoLink?.replace('http:', 'https:')
        } as Book;
    });
  } catch (e) {
    return [];
  }
};

export const getTrendingBooks = async (context?: string): Promise<Book[]> => {
  try {
    const query = context || `subject:fiction ${SYSTEM_DATE}`;
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=30&printType=books&orderBy=relevance`); 
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
            buyLink: info.infoLink?.replace('http:', 'https:')
        } as Book;
    });
  } catch (e) {
    return [];
  }
};

export const fetchWebTrendingBooks = async (): Promise<Book[]> => {
  const ai = getAi();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Identify 15 highly anticipated fiction books for 2025. List: Title by Author.`,
      config: { tools: [{ googleSearch: {} }] },
    });
    const text = response.text || "";
    const lines = text.split('\n').filter(l => l.includes('by')).map(l => l.replace(/^\d+\.\s*/, '').trim());
    const results = await Promise.all(lines.slice(0, 10).map(line => searchBooks(line, false, 1)));
    return results.flat();
  } catch (error) {
    return getTrendingBooks();
  }
};

export const fetchHiddenGems = async (): Promise<Book[]> => {
  const ai = getAi();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find 15 cult classic "Hidden Gem" books. List: Title by Author.`,
      config: { tools: [{ googleSearch: {} }] },
    });
    const text = response.text || "";
    const lines = text.split('\n').filter(l => l.includes('by')).map(l => l.replace(/^\d+\.\s*/, '').trim());
    const results = await Promise.all(lines.slice(0, 10).map(line => searchBooks(line, false, 1)));
    return results.flat();
  } catch (error) {
    return [];
  }
};

export const getCharacterPersona = async (title: string, author: string): Promise<CharacterPersona> => {
  const cacheKey = `persona-${title}-${author}`;
  if (aiCache.has(cacheKey)) return aiCache.get(cacheKey);

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
  aiCache.set(cacheKey, result);
  return result;
};

export const createChatSession = (sys: string): Chat => {
  const ai = getAi();
  return ai.chats.create({ 
    model: "gemini-3-flash-preview", 
    config: { systemInstruction: sys + ` Sync Date: ${SYSTEM_DATE}. Be concise.` } 
  });
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

// Fixed missing editMoodImage function for image-to-image editing
export const editMoodImage = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = getAi();
  
  // Extract base64 data and mime type from the data URL
  const match = base64Image.match(/^data:(.*?);base64,(.*)$/);
  if (!match) throw new Error("Invalid image format provided for editing.");
  
  const mimeType = match[1];
  const data = match[2];

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: data,
            mimeType: mimeType,
          },
        },
        {
          text: prompt,
        },
      ],
    },
  });

  // Find the image part in the response
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("The archives failed to alter the visual representation.");
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
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
  }

  return await decodeAudioData(decode(base64Audio!), audioContext, 24000, 1);
};

export const connectToLiveLibrarian = async (onAudio: (buffer: AudioBuffer) => void, onClose: () => void) => {
  const ai = getAi();
  const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
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
          sessionPromise.then(session => {
            session.sendRealtimeInput({ 
              media: { 
                data: encode(new Uint8Array(int16.buffer)), 
                mimeType: 'audio/pcm;rate=16000' 
              } 
            });
          });
        };
        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);
      },
      onmessage: async (m) => {
        const b64 = m.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (b64) {
          // Manual decoding for live audio
          const binaryString = atob(b64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
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
    config: { 
      responseModalities: [Modality.AUDIO], 
      systemInstruction: `You are Atmosphera's librarian. Helper for ${SYSTEM_DATE}. Keep responses short and atmospheric.` 
    },
  });
  
  return { 
    disconnect: async () => { 
      const session = await sessionPromise;
      session.close(); 
      stream.getTracks().forEach(t => t.stop()); 
    } 
  };
};
