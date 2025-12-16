import { GoogleGenAI, Type, Schema, Modality, LiveServerMessage } from "@google/genai";
import { UserPreferences, Book, WebSource } from "../types";

const parseApiKey = (): string => {
    const key = process.env.API_KEY;
    if (!key) {
        console.error("CRITICAL: API Key is missing from environment.");
    }
    return key || '';
};

const apiKey = parseApiKey();
const ai = new GoogleGenAI({ apiKey });

// --- DISCOVERY ENGINE DATASETS (10M+ Books Entry Points) ---
const DISCOVERY_GENRES = [
  'Fiction', 'Mystery', 'Thriller', 'Romance', 'Fantasy', 'Sci-Fi', 'Horror', 'History', 
  'Biography', 'Science', 'Technology', 'Art', 'Cooking', 'Travel', 'Psychology', 
  'Philosophy', 'Business', 'Self-Help', 'Comics', 'Graphic Novels', 'Poetry', 
  'Religion', 'Sports', 'Music', 'Architecture', 'Design', 'Photography', 'Crafts', 
  'Gardening', 'True Crime', 'Humor', 'Drama', 'Cyberpunk', 'Steampunk', 'Space Opera', 
  'High Fantasy', 'Dark Fantasy', 'Historical Fiction', 'Literary Fiction', 'Contemporary', 
  'Dystopian', 'Memoir', 'Essays', 'Journalism', 'Politics', 'Social Science', 'Education',
  'Language', 'Reference', 'Law', 'Medicine', 'Engineering', 'Transportation', 'Computers',
  'Mathematics', 'Nature', 'Pets', 'Family', 'Health', 'Fitness', 'Body', 'Mind', 'Spirit',
  'Occult', 'Paranormal', 'Urban Fantasy', 'Action', 'Adventure', 'War', 'Western',
  'Classic', 'Folklore', 'Mythology', 'Anthology', 'Archaeology', 'Anthropology'
];

// --- FALLBACK DATA (Offline Mode) ---
const FALLBACK_TRENDING: Book[] = [
    { title: "The Midnight Library", author: "Matt Haig", isbn: "9780525559474", description: "Between life and death there is a library.", reasoning: "Global bestseller.", moodColor: "#1e293b", genre: "Fiction", excerpt: "Between life and death there is a library.", language: "English", moviePairing: "It's a Wonderful Life" },
    { title: "Project Hail Mary", author: "Andy Weir", isbn: "9780593135204", description: "A lone astronaut must save the earth.", reasoning: "Gripping Sci-Fi.", moodColor: "#eab308", genre: "Sci-Fi", excerpt: "I wake up.", language: "English", moviePairing: "The Martian" },
    { title: "Dune", author: "Frank Herbert", isbn: "9780441172719", description: "A mythic and emotionally charged hero's journey.", reasoning: "Sci-Fi Masterpiece.", moodColor: "#d97706", genre: "Sci-Fi", excerpt: "I must not fear.", language: "English", moviePairing: "Blade Runner 2049" },
    { title: "1984", author: "George Orwell", isbn: "9780451524935", description: "Big Brother is watching you.", reasoning: "Classic Dystopia.", moodColor: "#3f3f46", genre: "Dystopian", excerpt: "It was a bright cold day in April.", language: "English", moviePairing: "Brazil" },
    { title: "The Hobbit", author: "J.R.R. Tolkien", isbn: "9780547928227", description: "In a hole in the ground there lived a hobbit.", reasoning: "Fantasy Classic.", moodColor: "#166534", genre: "Fantasy", excerpt: "In a hole in the ground there lived a hobbit.", language: "English", moviePairing: "The Lord of the Rings" },
    { title: "Pride and Prejudice", author: "Jane Austen", isbn: "9780141439518", description: "It is a truth universally acknowledged...", reasoning: "Romance Classic.", moodColor: "#f472b6", genre: "Romance", excerpt: "It is a truth universally acknowledged.", language: "English", moviePairing: "Emma" }
];

// --- SECURITY & UTILS ---

const sanitizeInput = (input: string): string => {
  if (!input) return "";
  return input.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim().substring(0, 300);
};

const parseJSON = <T>(text: string | undefined): T => {
  if (!text) return [] as unknown as T;
  try {
    const cleanText = text.replace(/```json\s*([\s\S]*?)\s*```/g, '$1')
                          .replace(/```\s*([\s\S]*?)\s*```/g, '$1')
                          .trim();
    return JSON.parse(cleanText) as T;
  } catch (e) {
    console.error("JSON Parse Error:", e, text);
    throw new Error("The oracle's words were unintelligible. (Data Parsing Error)");
  }
};

async function callWithRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRetryable = error?.status === 429 || error?.status >= 500;
    if (retries > 0 && isRetryable) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// --- BOOK RECS (AI CURATION) ---

const bookSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    author: { type: Type.STRING },
    isbn: { type: Type.STRING, description: "A valid ISBN-13 for the PAPERBACK edition. Crucial for cover images." },
    genre: { type: Type.STRING },
    description: { type: Type.STRING, description: "2 sentences max." },
    reasoning: { type: Type.STRING, description: "One short sentence on why it fits." },
    moodColor: { type: Type.STRING, description: "Hex color code matching the book's vibe." },
    excerpt: { type: Type.STRING, description: "A very short, atmospheric teaser sentence." },
    ebookUrl: { type: Type.STRING, description: "A link to the E-Book (Project Gutenberg, OpenLibrary, or Google Books). If not free, provide a Google Books/Amazon link." },
    moviePairing: { type: Type.STRING, description: "A movie or visual media recommendation that matches the book's specific mood and aesthetic." },
    language: { type: Type.STRING, description: "The primary language of the book edition (e.g. 'English', 'Spanish')." }
  },
  required: ["title", "author", "isbn", "reasoning", "moodColor", "genre", "description", "excerpt", "moviePairing", "language"],
};

export const getBookRecommendations = async (prefs: UserPreferences): Promise<Book[]> => {
  if (!apiKey) throw new Error("API Key configuration is missing.");
  const model = "gemini-2.5-flash";
  const sanitizedInterest = sanitizeInput(prefs.specificInterest || "Surprise me");
  
  const prompt = `
    Recommend 4 atmospheric books in ${prefs.language || 'English'} specifically curated for the '${prefs.age}' age group.
    
    User Context:
    - Age Group: ${prefs.age}
    - Weather: ${prefs.weather}
    - Mood: ${prefs.mood}
    - Pace: ${prefs.pace}
    - Setting: ${prefs.setting}
    - Interest: ${sanitizedInterest}
    
    CRITICAL INSTRUCTIONS:
    1. **Markov Chain Genre Switching**: Do NOT recommend 4 books of the exact same genre. Simulate a Markov chain where the genre shifts slightly between recommendations.
    2. **Aesthetics**: Infer a dominant "Mood Color" and "Movie Pairing" for each book based on the User Context provided.
    3. Return VALID JSON matching the schema.
    4. ISBN MUST be for a widely available PAPERBACK edition (ISBN-13 preferred).
    5. Include a valid 'ebookUrl' for each book (prioritize free sources like Project Gutenberg if public domain).
  `;

  try {
    const response = await callWithRetry(async () => {
      return await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: { type: Type.ARRAY, items: bookSchema },
        }
      });
    });
    return parseJSON<Book[]>(response.text);
  } catch (error: any) {
    console.error("Backend Error [Recommendations]:", error);
    throw new Error(error.message || "Unable to divine recommendations at this moment.");
  }
};

// --- DATASET ACCESS (GOOGLE BOOKS API) ---

// Helper to map API results to our Book interface with EXTENDED METADATA
const mapGoogleBook = (item: any): Book => {
    const info = item.volumeInfo;
    const saleInfo = item.saleInfo;
    const accessInfo = item.accessInfo;

    const isbnObj = info.industryIdentifiers?.find((i: any) => i.type === 'ISBN_13') || info.industryIdentifiers?.[0];
    const category = info.categories?.[0] || 'General';
    
    // Deterministic mood color generation based on title hash
    const hash = (info.title || '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const colors = ['#1e293b', '#334155', '#0f172a', '#1e1b4b', '#312e81', '#3730a3', '#4c1d95', '#581c87', '#701a75', '#831843', '#881337', '#9f1239', '#064e3b', '#14532d', '#713f12', '#451a03'];
    const moodColor = colors[hash % colors.length];

    // Ensure https
    let thumb = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;
    if (thumb) thumb = thumb.replace('http:', 'https:');

    return {
        title: info.title,
        author: info.authors ? info.authors.join(', ') : 'Unknown',
        isbn: isbnObj?.identifier,
        description: info.description ? (info.description.substring(0, 200) + '...') : 'No description available.',
        reasoning: `From the Global Archive: ${category}`,
        moodColor: moodColor,
        genre: category,
        excerpt: info.searchInfo?.textSnippet || info.description?.substring(0, 100) || "Click to explore this title...",
        language: info.language,
        moviePairing: "Ask the Librarian",
        ebookUrl: info.previewLink || info.infoLink,
        coverUrl: thumb,
        
        // Rich Metadata
        publisher: info.publisher,
        publishedDate: info.publishedDate,
        pageCount: info.pageCount,
        averageRating: info.averageRating,
        ratingsCount: info.ratingsCount,

        // E-book Specific Metadata
        isEbook: saleInfo?.isEbook,
        saleability: saleInfo?.saleability,
        price: saleInfo?.listPrice ? { 
            amount: saleInfo.listPrice.amount, 
            currencyCode: saleInfo.listPrice.currencyCode 
        } : undefined,
        buyLink: saleInfo?.buyLink,
        accessViewStatus: accessInfo?.accessViewStatus,
        pdfAvailable: accessInfo?.pdf?.isAvailable,
        epubAvailable: accessInfo?.epub?.isAvailable,

    } as Book;
};

// FAST SEARCH via Google Books API
export const searchBooks = async (query: string): Promise<Book[]> => {
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&printType=books&langRestrict=en`);
    const data = await res.json();
    
    if (!data.items) return [];
    return data.items.map(mapGoogleBook);

  } catch (error: any) {
      console.error("Fast search error:", error);
      return [];
  }
};

// DISCOVERY ENGINE: ACCESS 10M+ BOOKS
export const getTrendingBooks = async (context?: string): Promise<Book[]> => {
  try {
    let query = '';
    
    if (context) {
        // Contextual Discovery
        query = context;
    } else {
        // Random Discovery from massive dataset
        const randomSubject = DISCOVERY_GENRES[Math.floor(Math.random() * DISCOVERY_GENRES.length)];
        query = `subject:${randomSubject}`;
        console.log(`Discovering books in genre: ${randomSubject}`);
    }

    // Randomize 'startIndex' to dig deeper into the 10M+ dataset (0-100 random offset)
    const startIndex = Math.floor(Math.random() * 40);

    // Query Google Books API
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&startIndex=${startIndex}&maxResults=20&printType=books&langRestrict=en`);
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
        // Fallback if the random subject yields nothing (rare)
        return [...FALLBACK_TRENDING].sort(() => Math.random() - 0.5);
    }

    // Map and Shuffle
    const books = data.items.map(mapGoogleBook);
    return books.sort(() => Math.random() - 0.5);

  } catch (error) {
    console.warn("Discovery Engine unreachable, using local archive.", error);
    return [...FALLBACK_TRENDING].sort(() => Math.random() - 0.5);
  }
};

// --- GOOGLE SEARCH GROUNDING ---

export const fetchBookDetails = async (bookTitle: string, author: string): Promise<{ summary: string; sources: WebSource[] }> => {
  if (!apiKey) return { summary: "Live details unavailable.", sources: [] };
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find recent reviews, key themes, and interesting facts about the book "${bookTitle}" by ${author}. Keep it brief (2 sentences).`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const sources: WebSource[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ uri: chunk.web.uri, title: chunk.web.title });
        }
      });
    }

    return {
      summary: response.text || "No details found.",
      sources: sources.slice(0, 3) 
    };
  } catch (error) {
    console.error("Search Grounding Error:", error);
    return { summary: "Could not fetch real-time info.", sources: [] };
  }
};

// --- IMAGE GENERATION & EDITING ---

export const generateMoodImage = async (description: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Generate a high-quality, artistic, atmospheric digital painting representing this scene: ${description}. No text.` }],
      },
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Image Gen Error:", JSON.stringify(error));
    // Suppress the 500 error to the UI, let fallback handling take over in the UI
    throw new Error("Unable to visualize this world right now.");
  }
};

export const editMoodImage = async (base64Image: string, prompt: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
          { text: prompt }
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No edited image returned");
  } catch (error) {
    console.error("Image Edit Error:", error);
    throw new Error("Unable to modify this world right now.");
  }
};

// --- AUDIO (TTS) ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

export const generateAudioPreview = async (text: string): Promise<AudioBuffer> => {
  const sanitizedText = sanitizeInput(text);
  if (!apiKey) throw new Error("API Key missing");
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: sanitizedText }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  return await decodeAudioData(decode(base64Audio), audioContext);
};

// --- LIVE API (CONVERSATIONAL) ---

export const connectToLiveLibrarian = async (
  onAudioData: (buffer: AudioBuffer) => void,
  onClose: () => void
) => {
  if (!apiKey) {
      alert("API Key missing. Cannot start live session.");
      throw new Error("No API Key");
  }
  const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  const source = inputAudioContext.createMediaStreamSource(stream);
  const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
  
  scriptProcessor.connect(inputAudioContext.destination);
  source.connect(scriptProcessor);

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: "You are the Atmosphera Librarian. A wise, calm, and slightly mystical entity who helps users find books based on their mood and weather. Keep responses concise and atmospheric.",
    },
    callbacks: {
      onopen: () => console.log("Live Session Open"),
      onmessage: async (message: LiveServerMessage) => {
        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
           const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext);
           onAudioData(audioBuffer);
        }
      },
      onclose: () => {
        console.log("Live Session Closed");
        onClose();
        stream.getTracks().forEach(t => t.stop());
        inputAudioContext.close();
        outputAudioContext.close();
      },
      onerror: (err) => console.error("Live Error", err)
    }
  });

  scriptProcessor.onaudioprocess = (e) => {
    const inputData = e.inputBuffer.getChannelData(0);
    const l = inputData.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = inputData[i] * 32768;
    }
    
    sessionPromise.then(session => {
        let binary = '';
        const bytes = new Uint8Array(int16.buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const b64 = btoa(binary);

        session.sendRealtimeInput({
            media: {
                mimeType: 'audio/pcm;rate=16000',
                data: b64
            }
        });
    });
  };

  return {
    disconnect: async () => {
      const session = await sessionPromise;
      session.close();
      stream.getTracks().forEach(t => t.stop());
      source.disconnect();
      scriptProcessor.disconnect();
      inputAudioContext.close();
      outputAudioContext.close();
    }
  };
};