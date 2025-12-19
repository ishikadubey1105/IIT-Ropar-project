
import { GoogleGenAI, Type, Modality, LiveServerMessage, Chat, GenerateContentResponse } from "@google/genai";
import { UserPreferences, Book, CharacterPersona, EnhancedDetails, WebSource } from "../types";

// Helper to ensure fresh AI instance
const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// System Date Constant - Grounded in the present moment
const SYSTEM_DATE = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

// Helper to clean and parse JSON from model responses
const extractJson = (text: string) => {
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON parsing failed", text);
    throw new Error("The literary archives returned an unreadable format.");
  }
};

// --- HELPERS ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
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

const formatError = (error: any, context: string): string => {
  console.error(`Error in ${context}:`, error);
  return `A literary echo failed: ${error?.message?.substring(0, 60) || 'Unknown disturbance'}.`;
};

/**
 * Transforms boring marketing descriptions into cinematic Atmosphera prose.
 */
const enhanceVibe = async (book: Partial<Book>): Promise<string> => {
  const ai = getAi();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Rewrite this description for "${book.title}" to be poetic, cinematic, and atmospheric. 
      STRICT RULES: No marketing fluff, no 'bestseller' tags, max 180 chars. Focus on the soul of the story.
      Archival Date: ${SYSTEM_DATE}.
      Original: ${book.description}`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text?.trim() || book.description || "";
  } catch (e) {
    return book.description || "";
  }
};

const truncateDescription = (text: string): string => {
  if (!text) return "No description available.";
  const cleanText = text.replace(/DISCLAIMER:.*?novel\./is, '').trim();
  if (cleanText.length <= 250) return cleanText;
  return cleanText.substring(0, 250).trim() + "...";
};

/**
 * Discovers trending books with web grounding as of today.
 * Parallelized for performance.
 */
export const fetchWebTrendingBooks = async (): Promise<Book[]> => {
  const ai = getAi();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Identify exactly 5 of the most trending or anticipated books globally for the week of ${SYSTEM_DATE}. 
      Return strictly as a list: Title by Author.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const webSources: any[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const booksSources: WebSource[] = webSources.filter(chunk => chunk.web).map(chunk => ({
        uri: chunk.web.uri,
        title: chunk.web.title
    }));

    const text = response.text || "";
    const lines = text.split('\n')
      .map(l => l.replace(/^\d+\.\s*/, '').trim())
      .filter(l => l.length > 5 && l.toLowerCase().includes('by'));

    // PARALLEL FETCHING: Fetch but DO NOT Enhance initially to reduce lag
    const bookPromises = lines.slice(0, 5).map(async (line): Promise<Book | null> => {
      try {
        const searchResults = await searchBooks(line, false); // Disabled enhance for performance
        if (searchResults.length > 0) {
          return {
            ...searchResults[0],
            atmosphericRole: "Global Sensation",
            reasoning: `Archival Sync: ${SYSTEM_DATE}. High cultural relevance confirmed.`,
            sources: booksSources.length > 0 ? booksSources : undefined
          };
        }
        return null;
      } catch (e) {
        return null;
      }
    });

    const results = await Promise.all(bookPromises);
    return results.filter((b): b is Book => b !== null);
  } catch (error) {
    console.error("Web trending search failed.", error);
    return getTrendingBooks(`bestselling fiction ${SYSTEM_DATE}`);
  }
};

export const getBookRecommendations = async (prefs: UserPreferences): Promise<{ heading: string, insight: string, antiRecommendation: string, books: Book[], confidence: string }> => {
  const ai = getAi();
  const systemInstruction = `
    You are Atmosphera, an elite book recommendation engine.
    Archival Date: ${SYSTEM_DATE}.
    STRICT CONSTRAINT: Descriptions must be cinematic, eye-catchy, and evocative.
    Avoid all generic marketing speak. Focus on imagery and vibe.
    Use the user's weather input '${prefs.weather}' to drastically shape the tone of the recommendations.
  `;

  const prompt = `
    ENVIRONMENTAL INPUT (${SYSTEM_DATE}):
    - Weather: ${prefs.weather}
    - Mood: ${prefs.mood}
    - Energy: ${prefs.pace}
    - Setting: ${prefs.setting}
    - Interest: ${prefs.specificInterest || 'Curate the absolute best atmosphere'}

    Provide a highly curated set of 5 books.
    Make sure the 'heading' explicitly relates to the '${prefs.weather}' weather and '${prefs.mood}' mood.
    Return JSON: heading, insight, antiRecommendation, confidence, books[].
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
                heading: { type: Type.STRING, description: "A creative title for this collection based on the weather/mood." },
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
                      description: { type: Type.STRING, description: "Cinematic and poetic description." },
                      reasoning: { type: Type.STRING },
                      atmosphericRole: { type: Type.STRING },
                      sectionFit: { type: Type.STRING },
                      momentFit: { type: Type.STRING },
                      cognitiveEffort: { type: Type.STRING, enum: ["Light", "Moderate", "Demanding"] },
                      moodColor: { type: Type.STRING },
                      excerpt: { type: Type.STRING }
                    },
                    required: ["title", "author", "reasoning", "moodColor", "genre", "description", "excerpt", "atmosphericRole", "sectionFit", "momentFit", "cognitiveEffort"]
                  }
                }
            },
            required: ["heading", "insight", "antiRecommendation", "confidence", "books"]
        },
      }
    });
    
    return extractJson(response.text);
  } catch (error) {
    throw new Error(formatError(error, "getBookRecommendations"));
  }
};

export const fetchEnhancedBookDetails = async (book: Book, prefs: UserPreferences | null): Promise<EnhancedDetails> => {
  const ai = getAi();
  const systemInstruction = `
    You are Atmosphera. Generate crisp, eye-catchy book metadata for ${SYSTEM_DATE}.
    Descriptions must be poetic and focus on sensory details.
  `;

  const prompt = `Generate deep metadata for "${book.title}" by ${book.author}. Synchronized for ${SYSTEM_DATE}.`;

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
    return extractJson(response.text);
  } catch (error) {
    throw new Error(formatError(error, "fetchEnhancedBookDetails"));
  }
};

export const searchBooks = async (query: string, enhance: boolean = false): Promise<Book[]> => {
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&printType=books`);
    const data = await res.json();
    const books = (data.items || []).map((item: any) => {
        const info = item.volumeInfo;
        return {
            title: info.title,
            author: info.authors?.join(', ') || 'Unknown',
            isbn: info.industryIdentifiers?.[0]?.identifier,
            description: truncateDescription(info.description),
            genre: info.categories?.[0] || 'General',
            publisher: info.publisher,
            moodColor: '#475569',
            atmosphericRole: 'Immersive',
            cognitiveEffort: 'Moderate',
            excerpt: info.description?.substring(0, 100) || '',
            coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:')
        } as Book;
    });

    if (enhance && books.length > 0) {
      books[0].description = await enhanceVibe(books[0]);
    }

    return books;
  } catch (e) {
    console.error("searchBooks error", e);
    return [];
  }
};

export const getTrendingBooks = async (context?: string): Promise<Book[]> => {
  try {
    const query = context || `subject:fiction ${SYSTEM_DATE}`;
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&printType=books`);
    const data = await res.json();
    return (data.items || []).map((item: any) => {
        const info = item.volumeInfo;
        return {
            title: info.title,
            author: info.authors?.join(', ') || 'Unknown',
            isbn: info.industryIdentifiers?.[0]?.identifier,
            description: truncateDescription(info.description),
            genre: info.categories?.[0] || 'General',
            publisher: info.publisher,
            moodColor: '#475569',
            atmosphericRole: 'Immersive',
            cognitiveEffort: 'Moderate',
            excerpt: info.description?.substring(0, 100) || '',
            coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:')
        } as Book;
    });
  } catch (e) {
    console.error("getTrendingBooks error", e);
    return [];
  }
};

export const getCharacterPersona = async (title: string, author: string): Promise<CharacterPersona> => {
  const ai = getAi();
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Identify a character from "${title}" by ${author}. Dec 2025 sync. Return JSON: name, greeting, systemInstruction.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: { name: { type: Type.STRING }, greeting: { type: Type.STRING }, systemInstruction: { type: Type.STRING } },
        required: ["name", "greeting", "systemInstruction"]
      }
    }
  });
  return extractJson(response.text);
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

export const editMoodImage = async (base64Url: string, prompt: string): Promise<string> => {
  const ai = getAi();
  const base64Data = base64Url.includes(',') ? base64Url.split(',')[1] : base64Url;
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ inlineData: { data: base64Data, mimeType: 'image/png' } }, { text: prompt }],
    },
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("No imagery found.");
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
  return await decodeAudioData(decode(base64Audio!), audioContext, 24000, 1);
};

export const connectToLiveLibrarian = async (onAudio: (buffer: AudioBuffer) => void, onClose: () => void) => {
  const ai = getAi();
  const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
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
          const audioBuffer = await decodeAudioData(decode(b64), outputAudioContext, 24000, 1);
          onAudio(audioBuffer);
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
