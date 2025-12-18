
import { GoogleGenAI, Type, Modality, LiveServerMessage, Chat, GenerateContentResponse } from "@google/genai";
import { UserPreferences, Book, CharacterPersona, EnhancedDetails } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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
 * Truncates text to approximately 5-6 lines (approx 300 characters)
 */
const truncateDescription = (text: string): string => {
  if (!text) return "No description available.";
  // If it contains a disclaimer about being a summary, try to find the start of actual content
  const cleanText = text.replace(/DISCLAIMER:.*?novel\./is, '').trim();
  if (cleanText.length <= 300) return cleanText;
  return cleanText.substring(0, 300).trim() + "...";
};

/**
 * Robustly discovers global trending books via Search Grounding.
 */
export const fetchWebTrendingBooks = async (): Promise<Book[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Identify the top 8 most trending/popular books globally right now (Late 2024/Early 2025). Return exactly 'Title by Author' per line. No extra chat.",
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const lines = text.split('\n')
      .map(l => l.replace(/^\d+\.\s*/, '').trim())
      .filter(l => l.length > 3 && (l.toLowerCase().includes('by') || l.includes(' - ')));

    const trendingBooks: Book[] = [];
    // Only take top 6 to keep it crisp
    for (const line of lines.slice(0, 6)) {
      try {
        const results = await searchBooks(line);
        if (results.length > 0) {
          trendingBooks.push({
            ...results[0],
            atmosphericRole: "Global Sensation",
            reasoning: "Trending globally in search data."
          });
        }
      } catch (e) {
        console.warn(`Trend search failed: ${line}`, e);
      }
    }
    return trendingBooks;
  } catch (error) {
    console.error("Web trending search failed.", error);
    return getTrendingBooks("bestselling fiction 2024");
  }
};

export const getBookRecommendations = async (prefs: UserPreferences): Promise<{ heading: string, insight: string, antiRecommendation: string, books: Book[], confidence: string }> => {
  const systemInstruction = `
    You are Atmosphera, an elite book recommendation engine.
    
    STRICT CONSTRAINT: BREVITY IS GOD.
    ALL book descriptions MUST be exactly 5-6 lines (maximum 300 characters). 
    DO NOT include disclaimers, meta-commentary, or introductory fluff.
    Focus on the "vibe", atmosphere, and why it is a masterpiece.
    Be short, crisp, and evocative.
  `;

  const prompt = `
    ENVIRONMENTAL INPUT:
    - Weather: ${prefs.weather}
    - Mood: ${prefs.mood}
    - Energy: ${prefs.pace}
    - Setting: ${prefs.setting}
    - Interest: ${prefs.specificInterest || 'Best possible collection'}

    Return a JSON object:
    - heading: Cinematic title.
    - insight: One short, crisp phrase.
    - books: Array of 5 books. Description MUST be exactly 5-6 short lines.
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
                      description: { type: Type.STRING, description: "Max 300 characters, crisp vibe." },
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
    
    return JSON.parse(response.text || '{}');
  } catch (error) {
    throw new Error(formatError(error, "getBookRecommendations"));
  }
};

export const fetchEnhancedBookDetails = async (book: Book, prefs: UserPreferences | null): Promise<EnhancedDetails> => {
  const systemInstruction = `
    You are Atmosphera. Generate crisp book metadata.
    STRICT CONSTRAINT: Every single field must be short. 
    Synopses MUST be 5-6 sentences max. 
    NO fluff. NO disclaimers. 
    Be punchy and cinematic.
  `;

  const prompt = `Metadata for "${book.title}" by ${book.author}.`;

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
    return JSON.parse(response.text || '{}');
  } catch (error) {
    throw new Error(formatError(error, "fetchEnhancedBookDetails"));
  }
};

export const searchBooks = async (query: string): Promise<Book[]> => {
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&printType=books`);
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
    console.error("searchBooks error", e);
    return [];
  }
};

export const getTrendingBooks = async (context?: string): Promise<Book[]> => {
  try {
    const query = context || 'subject:fiction';
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&printType=books`);
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
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Identify a character from "${title}" by ${author}. Return JSON: name, greeting, systemInstruction. Keep greeting very short (max 12 words).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: { name: { type: Type.STRING }, greeting: { type: Type.STRING }, systemInstruction: { type: Type.STRING } },
        required: ["name", "greeting", "systemInstruction"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const createChatSession = (sys: string): Chat => ai.chats.create({ 
  model: "gemini-3-flash-preview", 
  config: { systemInstruction: sys + " Be crisp. Maximum 2 short sentences per response." } 
});

export const generateMoodImage = async (prompt: string): Promise<string> => {
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
      systemInstruction: 'You are Atmosphera\'s librarian. Help users find books. Keep responses short and crisp.' 
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
