import { GoogleGenAI, Type, Modality, LiveServerMessage, Chat } from "@google/genai";
import { UserPreferences, Book, WebSource, CharacterPersona } from "../types";

const parseApiKey = (): string => {
    const key = process.env.API_KEY;
    if (!key) {
        console.warn("System: API Key is missing. Features will degrade to offline mode.");
    }
    return key || '';
};

const apiKey = parseApiKey();
const ai = new GoogleGenAI({ apiKey });

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

// --- ERROR HANDLING UTILS ---

const formatError = (error: any, context: string): string => {
  console.error(`Error in ${context}:`, error);
  const msg = error?.message || '';
  if (msg.includes('API Key') || msg.includes('403')) return "The library archives are currently locked.";
  if (msg.includes('429')) return "The spirits are overwhelmed. Please wait a moment.";
  return "The ancient texts are illegible right now. Please try again.";
};

// --- ENHANCED DATASETS (Curated for Section Integrity) ---

const FALLBACK_TRENDING: Book[] = [
    // Global Bestsellers (Strictly justified by commercial/cultural impact)
    { 
      title: "The Alchemist", author: "Paulo Coelho", isbn: "9780062315007", 
      description: "A young shepherd travels from Andalusia to the Egyptian pyramids in search of treasure, only to find a different kind of riches.", 
      reasoning: "A quintessential global phenomenon translated into 80+ languages with over 65 million copies sold.", 
      moodColor: "#eab308", genre: "Fable", 
      excerpt: "When you want something, all the universe conspires in helping you to achieve it.", 
      atmosphericRole: "Grounding", cognitiveEffort: "Light",
      sectionFit: "Holding the Guinness World Record for the most translated book by a living author.",
      moviePairing: "The Secret Life of Walter Mitty", musicPairing: "Spanish Guitar", foodPairing: "Grapes & Dates" 
    },
    { 
      title: "A Man Called Ove", author: "Fredrik Backman", isbn: "9781476738024", 
      description: "A grumpy yet loveable curmudgeon who finds his solitary world turned upside down by a boisterous family moving in next door.", 
      reasoning: "A Swedish breakout that spent over 40 consecutive weeks on international bestseller lists.", 
      moodColor: "#3b82f6", genre: "Contemporary Fiction", 
      excerpt: "To love someone is like moving into a house. At first you fall in love with everything new.", 
      atmosphericRole: "Heartfelt", cognitiveEffort: "Light",
      sectionFit: "An international sensation that has sold over 3 million copies in the US alone.",
      moviePairing: "Up", musicPairing: "Acoustic Folk", foodPairing: "Coffee & Cinnamon Rolls" 
    },
    { 
      title: "The Shadow of the Wind", author: "Carlos Ruiz Zafón", isbn: "9780143034902", 
      description: "In post-war Barcelona, a young boy is taken to the Cemetery of Forgotten Books, leading him on a mystery that spans decades.", 
      reasoning: "One of the best-selling books in history, selling over 15 million copies across dozens of countries.", 
      moodColor: "#1e293b", genre: "Gothic Mystery", 
      excerpt: "Every book, every volume you see here, has a soul.", 
      atmosphericRole: "Immersive", cognitiveEffort: "Moderate",
      sectionFit: "A global critical and commercial juggernaut that redefined modern Spanish literature.",
      moviePairing: "The Others", musicPairing: "Classical Piano", foodPairing: "Red Wine & Olives" 
    },
    { 
      title: "Before the Coffee Gets Cold", author: "Toshikazu Kawaguchi", isbn: "9781529029581", 
      description: "In a small back alley in Tokyo, there is a cafe which has been serving carefully brewed coffee for more than one hundred years.", 
      reasoning: "A massive contemporary hit from Japan that has sold over 1 million copies in the UK alone.", 
      moodColor: "#78350f", genre: "Magical Realism", 
      excerpt: "The present hadn't changed—but those two people had.", 
      atmosphericRole: "Reflective", cognitiveEffort: "Moderate",
      sectionFit: "A viral international bestseller that spent weeks at the top of the Sunday Times list.",
      moviePairing: "Midnight in Paris", musicPairing: "Jazz Ballads", foodPairing: "Black Coffee" 
    },
    { 
      title: "The Girl with the Dragon Tattoo", author: "Stieg Larsson", isbn: "9780307949486", 
      description: "A disgraced journalist and a genius hacker team up to solve a cold case involving a wealthy family's dark past.", 
      reasoning: "A global chart-topper that launched the 'Millennium' phenomenon and sold 80 million copies of the series.", 
      moodColor: "#7f1d1d", genre: "Thriller", 
      excerpt: "He was a journalist who had spent his life uncovering other people's secrets.", 
      atmosphericRole: "Intense", cognitiveEffort: "Moderate",
      sectionFit: "The definitive bestseller that sparked a worldwide obsession with Nordic Noir.",
      moviePairing: "Se7en", musicPairing: "Industrial Ambient", foodPairing: "Sandwiches & Coffee" 
    },

    // Trending & Moment Fit
    { 
      title: "The Overstory", author: "Richard Powers", isbn: "9780393356687", 
      description: "A monumental novel about nine people whose unique life experiences with trees bring them together to address the destruction of forests.", 
      reasoning: "Deeply immersive and environmentally urgent.", 
      moodColor: "#064e3b", genre: "Literary Fiction", 
      excerpt: "The best time to plant a tree was twenty years ago. The second best time is now.", 
      atmosphericRole: "Grounding", cognitiveEffort: "Demanding",
      moviePairing: "Princess Mononoke", musicPairing: "Nature Sounds", foodPairing: "Walnuts & Honey" 
    },
    { 
      title: "Project Hail Mary", author: "Andy Weir", isbn: "9780593135204", 
      description: "Ryland Grace is the sole survivor on a desperate, last-chance mission—and if he fails, humanity and the earth itself will perish.", 
      reasoning: "A thrilling ride of scientific discovery.", 
      moodColor: "#eab308", genre: "Sci-Fi", 
      excerpt: "I'm going to science the shit out of this.", 
      atmosphericRole: "Energizing", cognitiveEffort: "Moderate",
      moviePairing: "Interstellar", musicPairing: "Synthwave", foodPairing: "Instant Noodles" 
    },
    { 
      title: "Circe", author: "Madeline Miller", isbn: "9780316556347", 
      description: "A bold retelling of the life of the goddess Circe.", 
      reasoning: "Lyrical, magical, and deeply feminist.", 
      moodColor: "#b45309", genre: "Fantasy", 
      excerpt: "But in a solitary life, there are rare moments when another soul dips near yours.", 
      atmosphericRole: "Contemplative", cognitiveEffort: "Moderate",
      moviePairing: "The Shape of Water", musicPairing: "Harp Solos", foodPairing: "Grapes & Wine" 
    }
];

// --- LOGIC ENGINE ---

const bookSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    author: { type: Type.STRING },
    isbn: { type: Type.STRING },
    genre: { type: Type.STRING },
    description: { type: Type.STRING },
    reasoning: { type: Type.STRING },
    atmosphericRole: { type: Type.STRING, description: "e.g., Grounding, Immersive, Contemplative, Energizing" },
    sectionFit: { type: Type.STRING, description: "Why this book belongs in the section." },
    momentFit: { type: Type.STRING, description: "Why this book fits the current atmosphere." },
    cognitiveEffort: { type: Type.STRING, enum: ["Light", "Moderate", "Demanding"] },
    moodColor: { type: Type.STRING },
    excerpt: { type: Type.STRING },
    moviePairing: { type: Type.STRING },
    musicPairing: { type: Type.STRING },
    foodPairing: { type: Type.STRING }
  },
  required: ["title", "author", "reasoning", "moodColor", "genre", "description", "excerpt", "atmosphericRole", "sectionFit", "momentFit", "cognitiveEffort"],
};

const recommendationResponseSchema = {
    type: Type.OBJECT,
    properties: {
        heading: { type: Type.STRING },
        insight: { type: Type.STRING },
        antiRecommendation: { type: Type.STRING },
        confidence: { type: Type.STRING, enum: ["High", "Medium", "Experimental"] },
        books: { type: Type.ARRAY, items: bookSchema }
    },
    required: ["heading", "insight", "antiRecommendation", "confidence", "books"]
};

export const getBookRecommendations = async (prefs: UserPreferences): Promise<{ heading: string, insight: string, antiRecommendation: string, books: Book[], confidence: string }> => {
  if (!apiKey) throw new Error("API Key missing.");
  
  const model = "gemini-3-flash-preview";
  const prompt = `
    You are Atmosphera, an advanced context-aware book recommendation engine.
    You optimize for moment-fit, section-integrity, and discovery quality.

    READER CONTEXT:
    Weather: ${prefs.weather}
    Emotion: ${prefs.mood}
    Energy: ${prefs.pace}
    Setting: ${prefs.setting}
    Interest: ${prefs.specificInterest || 'Surprise Me'}
    Language: ${prefs.language}

    TASK:
    1. Interpret atmospheric context: weather + emotion -> emotional undertone.
    2. Generate 5 books for the "Global Bestsellers" or "Just For You" context.
    3. Enforce SECTION INTEGRITY: A "Global Bestseller" must have proven commercial scale (millions sold, charts, awards). 
       DO NOT include books ABOUT bestsellers.
    4. Enforce DISCOVERY: Avoid repeating safety bestsellers if a fresh but successful alternative exists.
    5. Provide 'Reading Moment' heading, 'Anti-Recommendation' (poor fit right now, ≤25 words), and 'Read-Differently Insight'.
    
    JSON Output required.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: recommendationResponseSchema,
      }
    });
    
    const result = JSON.parse(response.text || '{}');
    return {
        heading: result.heading || "Curated Discovery",
        insight: result.insight || "Atmospheric resonance detected.",
        antiRecommendation: result.antiRecommendation || "Avoid heavy dramas today.",
        confidence: result.confidence || "High",
        books: result.books || []
    };
  } catch (error) {
    throw new Error(formatError(error, "getBookRecommendations"));
  }
};

const enrichBookMetadata = (title: string, genre: string, description: string): Partial<Book> => {
    const text = (title + genre + description).toLowerCase();
    let moodColor = '#475569';
    let role = 'Immersive';
    let effort: 'Light' | 'Moderate' | 'Demanding' = 'Moderate';

    if (text.includes('thriller') || text.includes('mystery')) {
        moodColor = '#7f1d1d'; role = 'Intense'; effort = 'Moderate';
    } else if (text.includes('romance')) {
        moodColor = '#be185d'; role = 'Heartfelt'; effort = 'Light';
    } else if (text.includes('sci-fi') || text.includes('future')) {
        moodColor = '#1e3a8a'; role = 'Expansive'; effort = 'Demanding';
    } else if (text.includes('self-help') || text.includes('habit')) {
        moodColor = '#059669'; role = 'Grounding'; effort = 'Light';
    }

    return { moodColor, atmosphericRole: role, cognitiveEffort: effort };
};

export const searchBooks = async (query: string): Promise<Book[]> => {
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&printType=books`);
    const data = await res.json();
    return (data.items || []).map((item: any) => {
        const info = item.volumeInfo;
        const meta = enrichBookMetadata(info.title, info.categories?.[0] || '', info.description || '');
        return {
            title: info.title,
            author: info.authors?.join(', ') || 'Unknown',
            isbn: info.industryIdentifiers?.[0]?.identifier,
            description: info.description || 'No description.',
            genre: info.categories?.[0] || 'General',
            moodColor: meta.moodColor,
            atmosphericRole: meta.atmosphericRole,
            cognitiveEffort: meta.cognitiveEffort,
            excerpt: info.description?.substring(0, 100),
            coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:')
        } as Book;
    });
  } catch {
    return [];
  }
};

export const getTrendingBooks = async (context?: string): Promise<Book[]> => {
  try {
    const query = context || 'subject:fiction';
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&printType=books`);
    const data = await res.json();
    
    // If we have no API results or specific "bestsellers" context, mix in our curated fallbacks
    if (!data.items) {
        return FALLBACK_TRENDING;
    }

    const books = data.items.map((item: any) => {
        const info = item.volumeInfo;
        const meta = enrichBookMetadata(info.title, info.categories?.[0] || '', info.description || '');
        return {
            title: info.title,
            author: info.authors?.join(', ') || 'Unknown',
            isbn: info.industryIdentifiers?.[0]?.identifier,
            description: info.description || 'No description.',
            genre: info.categories?.[0] || 'General',
            moodColor: meta.moodColor,
            atmosphericRole: meta.atmosphericRole,
            cognitiveEffort: meta.cognitiveEffort,
            excerpt: info.description?.substring(0, 100),
            coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:')
        } as Book;
    });

    if (context === "bestsellers") {
        // Priority to curated high-impact books for the Bestseller section
        return [...FALLBACK_TRENDING.filter(b => b.sectionFit), ...books].slice(0, 20);
    }

    return books;
  } catch {
    return FALLBACK_TRENDING;
  }
};

export const fetchBookDetails = async (title: string, author: string) => ({ summary: "A cinematic masterpiece of the written word.", sources: [] });
export const getCharacterPersona = async (title: string, author: string): Promise<CharacterPersona> => ({ name: "The Protagonist", greeting: "Welcome to my world.", systemInstruction: "Speak like a literary character." });
export const createChatSession = (sys: string): Chat => ai.chats.create({ model: "gemini-3-flash-preview", config: { systemInstruction: sys } });

export const generateMoodImage = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

export const editMoodImage = async (base64Url: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = base64Url.includes(',') ? base64Url.split(',')[1] : base64Url;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/png',
          },
        },
        { text: prompt },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

export const generateAudioPreview = async (t: string): Promise<AudioBuffer> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: t }] }],
    config: {
      responseModalalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  return await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
};

export const connectToLiveLibrarian = async (
  onAudio: (buffer: AudioBuffer) => void,
  onClose: () => void
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
  
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: () => {
        const source = inputAudioContext.createMediaStreamSource(stream);
        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
          const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
          const pcmBlob = createBlob(inputData);
          sessionPromise.then((session) => {
            session.sendRealtimeInput({ media: pcmBlob });
          });
        };
        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);
      },
      onmessage: async (message: LiveServerMessage) => {
        const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64EncodedAudioString) {
          const audioBuffer = await decodeAudioData(
            decode(base64EncodedAudioString),
            outputAudioContext,
            24000,
            1,
          );
          onAudio(audioBuffer);
        }
      },
      onerror: () => onClose(),
      onclose: () => onClose(),
    },
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: 'You are Atmosphera\'s librarian. You help users find books and chat about literature.'
    },
  });

  const session = await sessionPromise;

  function createBlob(data: Float32Array): { data: string, mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  return {
    disconnect: async () => {
      session.close();
      stream.getTracks().forEach(track => track.stop());
      await inputAudioContext.close();
      await outputAudioContext.close();
    }
  };
};