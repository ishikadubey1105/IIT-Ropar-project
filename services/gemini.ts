import { GoogleGenAI, Type, Schema, Modality, LiveServerMessage, Chat } from "@google/genai";
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

// --- ERROR HANDLING UTILS ---

const formatError = (error: any, context: string): string => {
  console.error(`Error in ${context}:`, error);

  const msg = error?.message || '';
  
  if (msg.includes('API Key') || msg.includes('403')) {
    return "The library archives are currently locked. (API Key Issue)";
  }
  if (msg.includes('429') || msg.includes('quota')) {
    return "The spirits are overwhelmed by too many requests. Please wait a moment and try again.";
  }
  if (msg.includes('500') || msg.includes('503')) {
    return "The connection to the ethereal plane is unstable. The librarian is taking a short break.";
  }
  if (msg.includes('fetch') || msg.includes('network')) {
    return "We cannot reach the archives. Please check your internet connection.";
  }
  if (msg.includes('SAFETY')) {
    return "The request was too volatile for the archives to handle. Please try a gentler prompt.";
  }

  return "The ancient texts are illegible right now. Please try again.";
};

// --- DISCOVERY ENGINE DATASETS ---
const DISCOVERY_GENRES = [
  // Personal Development & Psychology
  'Personal Development', 'Self-Help', 'Habit Formation', 'Productivity', 'Motivation', 'Leadership', 
  'Success', 'Wealth Creation', 'Financial Independence', 'Stoicism', 'Mindfulness', 'Neuroscience', 
  'Cognitive Science', 'Decision Making', 'Communication Skills', 'Emotional Intelligence', 'Negotiation',
  'Creativity', 'Focus', 'Time Management', 'Philosophy of Life', 'Minimalism', 'Biohacking',

  // Fiction & Literature
  'Fiction', 'Mystery', 'Thriller', 'Romance', 'Fantasy', 'Sci-Fi', 'Horror', 'Literary Fiction',
  'Historical Fiction', 'Contemporary Fiction', 'Satire', 'Dystopian', 'Cyberpunk', 'Steampunk',
  'Magical Realism', 'Graphic Novels', 'Comics', 'Manga', 'Poetry', 'Drama', 'Plays', 'Short Stories',
  'Anthology', 'Classic Literature', 'Folklore', 'Mythology', 'Fairy Tales', 'Western', 'War Fiction',
  'Espionage', 'Crime', 'Noir', 'Cozy Mystery', 'Psychological Thriller', 'Legal Thriller', 'Medical Thriller',
  'Paranormal Romance', 'Clean Romance', 'Space Opera', 'Hard Sci-Fi',
  'Apocalyptic', 'Post-Apocalyptic', 'Zombie', 'Vampire', 'Ghost Stories', 'Gothic', 'Southern Gothic',
  'Young Adult', 'New Adult', 'Middle Grade', 'Children\'s Books', 'Picture Books', 'Adventure',

  // Lifestyle, Arts & Business
  'Biography', 'Autobiography', 'Memoir', 'Essays', 'Journalism', 'True Crime',
  'Technology', 'Artificial Intelligence', 'Psychology', 'Sociology', 'Anthropology', 'Philosophy', 'Spirituality',
  'Buddhism', 'Taoism', 'Occult', 'Astrology', 'Tarot', 'Paranormal', 'Economics', 'Business',
  'Finance', 'Investing', 'Marketing', 'Entrepreneurship', 'Writing', 'Publishing',
  'Art', 'Design', 'Architecture', 'Photography', 'Fashion', 'Film', 'Music',
  'Cooking', 'Baking', 'Travel', 'Travelogues', 'Gardening',
  'Interior Design', 'Health', 'Fitness', 'Nutrition', 'Mental Health',
  'Parenting', 'Family', 'Nature', 'Environment', 'Climate Change', 'Sustainability',
  'Humor', 'Comedy', 'Video Games',

  // Indian Literature & Heritage
  'Indian Fiction', 'Indian Writing in English', 'Hindi Literature', 'Marathi Literature', 'Gujarati Literature',
  'Bengali Literature', 'Tamil Literature', 'Malayalam Literature', 'Indian Mythology', 'Mahabharata', 'Ramayana',
  'Bhagavad Gita', 'Ayurveda', 'Yoga Philosophy', 'Bollywood', 'Indian Cinema', 'Indian Cooking', 'Desi', 'Sufism',
  'Rabindranath Tagore', 'Premchand', 'Ruskin Bond', 'R.K. Narayan', 'Arundhati Roy', 'Salman Rushdie'
];

// --- FALLBACK DATA ---
const FALLBACK_TRENDING: Book[] = [
    // Personal Development & Psychology
    { 
      title: "Atomic Habits", author: "James Clear", isbn: "9780735211292", 
      description: "No matter your goals, Atomic Habits offers a proven framework for improving--every day.", 
      reasoning: "The ultimate manual for changing your life, one tiny step at a time.", 
      moodColor: "#eab308", genre: "Self-Help", 
      excerpt: "You do not rise to the level of your goals. You fall to the level of your systems.", 
      language: "English", moviePairing: "Limitless", musicPairing: "Focus Flow Playlist", foodPairing: "Black Coffee" 
    },
    { 
      title: "The Catalyst", author: "Jonah Berger", isbn: "9781982108605", 
      description: "Everyone has something they want to change. Marketers want to change their customers' minds and leaders want to change organizations.", 
      reasoning: "Understanding how to remove barriers to change rather than pushing harder.", 
      moodColor: "#3b82f6", genre: "Psychology", 
      excerpt: "To change minds, don't push. Remove the barriers.", 
      language: "English", moviePairing: "Moneyball", musicPairing: "Modern Classical", foodPairing: "Sparkling Water" 
    },
    { 
      title: "Deep Work", author: "Cal Newport", isbn: "9781455586691", 
      description: "Rules for focused success in a distracted world.", 
      reasoning: "Essential reading for mastering focus in the age of notifications.", 
      moodColor: "#f59e0b", genre: "Productivity", 
      excerpt: "Clarity about what matters provides clarity about what does not.", 
      language: "English", moviePairing: "The Social Network", musicPairing: "White Noise", foodPairing: "Green Tea" 
    },
    { 
      title: "The Psychology of Money", author: "Morgan Housel", isbn: "9780857197689", 
      description: "Timeless lessons on wealth, greed, and happiness.", 
      reasoning: "Money is not a math problem, it's a behavioral problem.", 
      moodColor: "#10b981", genre: "Finance", 
      excerpt: "Doing well with money has a little to do with how smart you are and a lot to do with how you behave.", 
      language: "English", moviePairing: "The Big Short", musicPairing: "Jazz", foodPairing: "Espresso" 
    },
    
    // Indian Heritage & Classics
    { 
      title: "Wings of Fire", author: "A.P.J. Abdul Kalam", isbn: "9788173711466", 
      description: "An autobiography of the former President of India, Dr. A.P.J. Abdul Kalam.", 
      reasoning: "A story of resilience, innovation, and the power of dreaming big.", 
      moodColor: "#ea580c", genre: "Autobiography", 
      excerpt: "We are all born with a divine fire in us. Our efforts should be to give wings to this fire.", 
      language: "English", moviePairing: "Rocketry: The Nambi Effect", musicPairing: "Indian Classical (Raga Bhairavi)", foodPairing: "Filter Coffee" 
    },
    { 
      title: "The Palace of Illusions", author: "Chitra Banerjee Divakaruni", isbn: "9781400096206", 
      description: "A reimagining of the world-famous Indian epic, the Mahabharat—told from the point of view of Panchaali.", 
      reasoning: "A feminist and magical perspective on ancient mythology.", 
      moodColor: "#db2777", genre: "Mythology", 
      excerpt: "I am Draupadi, born of fire.", 
      language: "English", moviePairing: "Baahubali", musicPairing: "Sitar Instrumentals", foodPairing: "Saffron Milk" 
    },
    { 
      title: "Train to Pakistan", author: "Khushwant Singh", isbn: "9780143065883", 
      description: "A historical novel that recounts the Partition of India in August 1947.", 
      reasoning: "A raw and haunting look at history and humanity.", 
      moodColor: "#7f1d1d", genre: "Historical Fiction", 
      excerpt: "The summer of 1947 was not like other Indian summers.", 
      language: "English", moviePairing: "Garam Hawa", musicPairing: "Silence", foodPairing: "Chai" 
    },

    // Global Fiction
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
    musicPairing: { type: Type.STRING, description: "A specific song, album, or genre that perfectly scores the reading experience." },
    foodPairing: { type: Type.STRING, description: "A food or drink item that pairs with the book's setting or vibe." },
    language: { type: Type.STRING, description: "The primary language of the book edition (e.g. 'English', 'Spanish')." }
  },
  required: ["title", "author", "isbn", "reasoning", "moodColor", "genre", "description", "excerpt", "moviePairing", "musicPairing", "foodPairing", "language"],
};

export const getBookRecommendations = async (prefs: UserPreferences): Promise<Book[]> => {
  if (!apiKey) throw new Error("API Key is missing. Please check your environment configuration.");
  
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
    - Format Preference: ${prefs.preferredFormat === 'audio' ? 'Audiobook (Focus on narration quality)' : 'Text'}
    
    CRITICAL INSTRUCTIONS:
    1. **Markov Chain Genre Switching**: Do NOT recommend 4 books of the exact same genre. Simulate a Markov chain where the genre shifts slightly between recommendations.
    2. **Aesthetics**: Infer a dominant "Mood Color" and "Movie Pairing" for each book based on the User Context provided.
    3. Return VALID JSON matching the schema.
    4. ISBN MUST be for a widely available PAPERBACK edition (ISBN-13 preferred).
    5. Include a valid 'ebookUrl' for each book (prioritize free sources like Project Gutenberg if public domain).
    ${prefs.preferredFormat === 'audio' ? '6. If possible, mention the specific narrator in the "reasoning" field (e.g., "Narrated by [Name], bringing the character to life...").' : ''}
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
    throw new Error(formatError(error, "getBookRecommendations"));
  }
};

// --- DATASET ACCESS (GOOGLE BOOKS API) ---

const mapGoogleBook = (item: any): Book => {
    const info = item.volumeInfo;
    const saleInfo = item.saleInfo;
    const accessInfo = item.accessInfo;

    const isbnObj = info.industryIdentifiers?.find((i: any) => i.type === 'ISBN_13') || info.industryIdentifiers?.[0];
    const category = info.categories?.[0] || 'General';
    
    const hash = (info.title || '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const colors = ['#1e293b', '#334155', '#0f172a', '#1e1b4b', '#312e81', '#3730a3', '#4c1d95', '#581c87', '#701a75', '#831843', '#881337', '#9f1239', '#064e3b', '#14532d', '#713f12', '#451a03'];
    const moodColor = colors[hash % colors.length];

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
        musicPairing: "Ambient Noise", 
        foodPairing: "Tea",
        ebookUrl: info.previewLink || info.infoLink,
        coverUrl: thumb,
        
        publisher: info.publisher,
        publishedDate: info.publishedDate,
        pageCount: info.pageCount,
        averageRating: info.averageRating,
        ratingsCount: info.ratingsCount,

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

export const searchBooks = async (query: string): Promise<Book[]> => {
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&printType=books`);
    if (!res.ok) {
        throw new Error(`Google Books API responded with ${res.status}`);
    }
    const data = await res.json();
    
    if (!data.items) return [];
    return data.items.map(mapGoogleBook);

  } catch (error: any) {
      console.error("Search API Error:", error);
      if (error.message.includes('Failed to fetch')) {
          throw new Error("Unable to connect to the global library. Please check your internet connection.");
      }
      throw new Error("The archives are momentarily inaccessible. Please try again.");
  }
};

export const getTrendingBooks = async (context?: string, orderByNewest: boolean = false): Promise<Book[]> => {
  try {
    let query = '';
    
    if (context) {
        query = context;
    } else {
        const genre1 = DISCOVERY_GENRES[Math.floor(Math.random() * DISCOVERY_GENRES.length)];
        
        if (Math.random() < 0.2) {
            const genre2 = DISCOVERY_GENRES[Math.floor(Math.random() * DISCOVERY_GENRES.length)];
            query = `subject:${genre1} subject:${genre2}`;
        } else {
            query = `subject:${genre1}`;
        }
    }

    const deepDiveLimit = 500; 
    const maxOffset = orderByNewest ? 0 : deepDiveLimit;
    const startIndex = Math.floor(Math.random() * (maxOffset + 1));
    const sortParam = orderByNewest ? '&orderBy=newest' : '';

    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&startIndex=${startIndex}&maxResults=20&printType=books${sortParam}`);
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
        if (startIndex > 0) {
             const retryRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&startIndex=0&maxResults=20&printType=books${sortParam}`);
             const retryData = await retryRes.json();
             if (retryData.items) return retryData.items.map(mapGoogleBook);
        }
        return [...FALLBACK_TRENDING].sort(() => Math.random() - 0.5);
    }

    const books = data.items.map(mapGoogleBook);
    return orderByNewest ? books : books.sort(() => Math.random() - 0.5);

  } catch (error) {
    console.warn("Discovery Engine unreachable, using fallback cache.", error);
    return [...FALLBACK_TRENDING].sort(() => Math.random() - 0.5);
  }
};

// --- GOOGLE SEARCH GROUNDING ---

export const fetchBookDetails = async (bookTitle: string, author: string): Promise<{ summary: string; sources: WebSource[] }> => {
  if (!apiKey) return { summary: "Live details unavailable (No API Key).", sources: [] };
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
  } catch (error: any) {
    console.error("Search Grounding Error:", error);
    return { summary: "Could not fetch real-time info.", sources: [] };
  }
};

// --- PERSONA CHAT ---

export const getCharacterPersona = async (bookTitle: string, author: string): Promise<CharacterPersona> => {
    if (!apiKey) throw new Error("API Key missing");
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Identify the single most interesting character (or the author) to talk to from the book "${bookTitle}" by ${author}. 
            Return a JSON object with: 
            1. 'name': The character's name.
            2. 'greeting': A short, in-character opening line to start a conversation.
            3. 'systemInstruction': A instruction paragraph telling an AI how to roleplay this character perfectly (tone, vocabulary, knowledge limit).
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        greeting: { type: Type.STRING },
                        systemInstruction: { type: Type.STRING }
                    },
                    required: ["name", "greeting", "systemInstruction"]
                }
            }
        });

        return parseJSON<CharacterPersona>(response.text);
    } catch (e: any) {
        throw new Error(formatError(e, "getCharacterPersona"));
    }
};

export const createChatSession = (systemInstruction: string): Chat => {
    if (!apiKey) throw new Error("API Key missing");
    return ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
            systemInstruction: systemInstruction,
        }
    });
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
  } catch (error: any) {
    throw new Error(formatError(error, "generateMoodImage"));
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
  } catch (error: any) {
    throw new Error(formatError(error, "editMoodImage"));
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
  
  try {
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
  } catch (e: any) {
      throw new Error(formatError(e, "generateAudioPreview"));
  }
};

// --- LIVE API (CONVERSATIONAL) ---

export const connectToLiveLibrarian = async (
  onAudioData: (buffer: AudioBuffer) => void,
  onClose: () => void
) => {
  if (!apiKey) {
      throw new Error("API Key missing. Cannot start live session.");
  }
  const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

  try {
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
        onerror: (err) => {
            console.error("Live Error", err);
            onClose();
        }
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
        }).catch(err => {
            console.error("Session promise error:", err);
            onClose();
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
  } catch (err: any) {
      console.error("Failed to connect", err);
      throw new Error("Unable to establish a voice connection. Please check your microphone permissions and try again.");
  }
};