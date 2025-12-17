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

  // Aesthetics & Niche
  'Dark Academia', 'Light Academia', 'Cottagecore', 'Solarpunk', 'Afrofuturism', 'Weird Fiction', 'Speculative Fiction',

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
      title: "The Psychology of Money", author: "Morgan Housel", isbn: "9780857197689", 
      description: "Timeless lessons on wealth, greed, and happiness.", 
      reasoning: "Money is not a math problem, it's a behavioral problem.", 
      moodColor: "#10b981", genre: "Finance", 
      excerpt: "Doing well with money has a little to do with how smart you are and a lot to do with how you behave.", 
      language: "English", moviePairing: "The Big Short", musicPairing: "Modern Jazz", foodPairing: "Espresso" 
    },
    { 
      title: "Deep Work", author: "Cal Newport", isbn: "9781455586691", 
      description: "Rules for focused success in a distracted world.", 
      reasoning: "Essential reading for mastering focus in the age of notifications.", 
      moodColor: "#f59e0b", genre: "Productivity", 
      excerpt: "Clarity about what matters provides clarity about what does not.", 
      language: "English", moviePairing: "The Social Network", musicPairing: "White Noise / Brown Noise", foodPairing: "Green Tea" 
    },
    { 
      title: "Meditations", author: "Marcus Aurelius", isbn: "9780140441406", 
      description: "Private notes of the Roman Emperor and Stoic philosopher.", 
      reasoning: "Ancient wisdom for modern chaos.", 
      moodColor: "#78350f", genre: "Philosophy", 
      excerpt: "You have power over your mind - not outside events. Realize this, and you will find strength.", 
      language: "English", moviePairing: "Gladiator", musicPairing: "Gregorian Chants", foodPairing: "Bread & Olive Oil" 
    },

    // Fiction - Sci-Fi & Fantasy
    { 
      title: "Dune", author: "Frank Herbert", isbn: "9780441172719", 
      description: "A mythic and emotionally charged hero's journey on a desert planet.", 
      reasoning: "A masterpiece of world-building and politics.", 
      moodColor: "#d97706", genre: "Sci-Fi", 
      excerpt: "I must not fear. Fear is the mind-killer.", 
      language: "English", moviePairing: "Blade Runner 2049", musicPairing: "Hans Zimmer Scores", foodPairing: "Spiced Coffee" 
    },
    { 
      title: "Project Hail Mary", author: "Andy Weir", isbn: "9780593135204", 
      description: "A lone astronaut must save the earth from disaster.", 
      reasoning: "Optimistic, scientific, and incredibly gripping.", 
      moodColor: "#eab308", genre: "Sci-Fi", 
      excerpt: "I wake up. I don't know my name.", 
      language: "English", moviePairing: "The Martian", musicPairing: "Synthwave", foodPairing: "Freeze-dried Ice Cream" 
    },
    { 
      title: "Circe", author: "Madeline Miller", isbn: "9780316556347", 
      description: "A bold retelling of the life of the goddess Circe.", 
      reasoning: "Lyrical, magical, and deeply feminist.", 
      moodColor: "#b45309", genre: "Fantasy", 
      excerpt: "But in a solitary life, there are rare moments when another soul dips near yours.", 
      language: "English", moviePairing: "Pan's Labyrinth", musicPairing: "Harp Music", foodPairing: "Wine & Cheese" 
    },
    { 
      title: "The Name of the Wind", author: "Patrick Rothfuss", isbn: "9780756404741", 
      description: "The tale of Kvothe, from his childhood in a troupe of traveling players to his years as a wizard.", 
      reasoning: "Poetic prose and an intricate magic system.", 
      moodColor: "#15803d", genre: "Fantasy", 
      excerpt: "It was the patient, cut-flower sound of a man who is waiting to die.", 
      language: "English", moviePairing: "Stardust", musicPairing: "Lute & Folk", foodPairing: "Hearty Stew" 
    },

    // Fiction - Mystery & Thriller
    { 
      title: "The Silent Patient", author: "Alex Michaelides", isbn: "9781250301697", 
      description: "A woman shoots her husband five times in the face and then never speaks another word.", 
      reasoning: "A psychological thriller with a twist you won't see coming.", 
      moodColor: "#991b1b", genre: "Thriller", 
      excerpt: "Alicia Berenson’s life is seemingly perfect.", 
      language: "English", moviePairing: "Gone Girl", musicPairing: "Tense Strings", foodPairing: "Dark Chocolate" 
    },
    { 
      title: "The Thursday Murder Club", author: "Richard Osman", isbn: "9780593299395", 
      description: "Four septuagenarians meet weekly to solve cold cases.", 
      reasoning: "Charming, funny, and surprisingly poignant.", 
      moodColor: "#4f46e5", genre: "Mystery", 
      excerpt: "Peace and quiet is all very well, but it can be quite boring.", 
      language: "English", moviePairing: "Knives Out", musicPairing: "British Invasion Rock", foodPairing: "Tea & Scones" 
    },

    // Literary & Contemporary
    { 
      title: "The Midnight Library", author: "Matt Haig", isbn: "9780525559474", 
      description: "Between life and death there is a library, and within that library, the shelves go on forever.", 
      reasoning: "A beautiful exploration of regret and the choices we make.", 
      moodColor: "#1e293b", genre: "Fiction", 
      excerpt: "Between life and death there is a library.", 
      language: "English", moviePairing: "It's a Wonderful Life", musicPairing: "Ambient Piano", foodPairing: "Peppermint Tea" 
    },
    { 
      title: "Norwegian Wood", author: "Haruki Murakami", isbn: "9780375704024", 
      description: "A magnificent story of love, loss, and coming of age in 1960s Tokyo.", 
      reasoning: "Melancholic, atmospheric, and deeply moving.", 
      moodColor: "#3f6212", genre: "Literary Fiction", 
      excerpt: "I was 37 then, strapped in my seat as the huge 747 plunged...", 
      language: "English", moviePairing: "Lost in Translation", musicPairing: "The Beatles & Jazz", foodPairing: "Whiskey" 
    },
    
    // Classics & Dark Academia
    { 
      title: "The Secret History", author: "Donna Tartt", isbn: "9781400031702", 
      description: "Under the influence of their charismatic classics professor, a group of clever misfits discover a new way of thinking.", 
      reasoning: "The ultimate Dark Academia novel.", 
      moodColor: "#2e1065", genre: "Dark Academia", 
      excerpt: "The snow in the mountains was melting and Bunny had been dead for several weeks.", 
      language: "English", moviePairing: "Dead Poets Society", musicPairing: "Classical & Choral", foodPairing: "Black Coffee & Cigarettes" 
    },
    { 
      title: "Pride and Prejudice", author: "Jane Austen", isbn: "9780141439518", 
      description: "The romantic clash between the opinionated Elizabeth and her proud beau, Mr. Darcy.", 
      reasoning: "The gold standard of witty romance.", 
      moodColor: "#be185d", genre: "Romance", 
      excerpt: "It is a truth universally acknowledged...", 
      language: "English", moviePairing: "Emma", musicPairing: "String Quartets", foodPairing: "Cucumber Sandwiches" 
    },
    { 
      title: "1984", author: "George Orwell", isbn: "9780451524935", 
      description: "Among the seminal texts of the 20th century, a haunting dystopia.", 
      reasoning: "A chilling look at surveillance and truth.", 
      moodColor: "#171717", genre: "Dystopian", 
      excerpt: "It was a bright cold day in April, and the clocks were striking thirteen.", 
      language: "English", moviePairing: "Brazil", musicPairing: "Industrial / Noise", foodPairing: "Gin" 
    },

    // Indian Heritage
    { 
      title: "The God of Small Things", author: "Arundhati Roy", isbn: "9780812979657", 
      description: "A drama of a family in Kerala, India, navigating love and social obligation.", 
      reasoning: "Lush prose that feels like a humid monsoon day.", 
      moodColor: "#065f46", genre: "Literary Fiction", 
      excerpt: "May in Ayemenem is a hot, brooding month.", 
      language: "English", moviePairing: "The Namesake", musicPairing: "Carnatic Violin", foodPairing: "Mango Pickles" 
    },
    { 
      title: "Train to Pakistan", author: "Khushwant Singh", isbn: "9780143065883", 
      description: "A historical novel that recounts the Partition of India in August 1947.", 
      reasoning: "A raw and haunting look at history and humanity.", 
      moodColor: "#7f1d1d", genre: "Historical Fiction", 
      excerpt: "The summer of 1947 was not like other Indian summers.", 
      language: "English", moviePairing: "Garam Hawa", musicPairing: "Silence", foodPairing: "Chai" 
    }
];

// --- SECURITY & UTILS ---

const sanitizeInput = (input: string): string => {
  if (!input) return "";
  return input.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim().substring(0, 300);
};

const parseJSON = <T>(text: string | undefined): T => {
  if (!text) return {} as unknown as T;
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
    isbn: { type: Type.STRING, description: "A valid ISBN-13 for the PAPERBACK edition." },
    genre: { type: Type.STRING, description: "The Atmospheric Role (e.g., 'Grounding', 'Quiet Escape', 'Reflective')." },
    description: { type: Type.STRING, description: "2 sentences max synopsis." },
    reasoning: { type: Type.STRING, description: "The 'Why now' explanation (35–45 words) referencing context." },
    moodColor: { type: Type.STRING, description: "Hex color matching the book's vibe." },
    excerpt: { type: Type.STRING, description: "One-line atmospheric description (max 20 words)." },
    ebookUrl: { type: Type.STRING },
    moviePairing: { type: Type.STRING },
    musicPairing: { type: Type.STRING },
    foodPairing: { type: Type.STRING },
    language: { type: Type.STRING }
  },
  required: ["title", "author", "isbn", "reasoning", "moodColor", "genre", "description", "excerpt", "moviePairing", "musicPairing", "foodPairing", "language"],
};

const recommendationResponseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        heading: { type: Type.STRING, description: "Reading Moment: A poetic but clear one-sentence description." },
        insight: { type: Type.STRING, description: "Read-Differently Insight: Single sentence on how a book feels different now." },
        antiRecommendation: { type: Type.STRING, description: "Anti-Recommendation: What to avoid and why (<= 25 words)." },
        books: { type: Type.ARRAY, items: bookSchema }
    },
    required: ["heading", "insight", "antiRecommendation", "books"]
};

export const getBookRecommendations = async (prefs: UserPreferences): Promise<{ heading: string, insight: string, antiRecommendation: string, books: Book[] }> => {
  if (!apiKey) throw new Error("API Key is missing. Please check your environment configuration.");
  
  const model = "gemini-2.5-flash";
  const sanitizedInterest = sanitizeInput(prefs.specificInterest || "Surprise me");
  
  // Context Derivation
  const date = new Date();
  const hours = date.getHours();
  const month = date.getMonth(); // 0-11
  
  const timeOfDay = hours < 5 ? "Late Night" : hours < 12 ? "Morning" : hours < 17 ? "Afternoon" : hours < 21 ? "Evening" : "Night";
  const season = (month < 2 || month === 11) ? "Winter" : (month < 5) ? "Spring" : (month < 8) ? "Summer" : "Autumn";
  
  const paceMap: Record<string, string> = { 'Slow burn': 'Low', 'Moderate pace': 'Medium', 'Fast-paced page turner': 'High' };
  const energyLevel = paceMap[prefs.pace || ''] || 'Medium';

  const prompt = `
    You are Atmosphera, an advanced context-aware literary intelligence system.
    You do not recommend books based on popularity, ratings, or generic similarity.
    You recommend books that fit a specific moment in a person’s life.

    READER CONTEXT
    External:
    - Current weather: ${prefs.weather}
    - Time of day: ${timeOfDay}
    - Season: ${season}

    Internal:
    - Primary emotion: ${prefs.mood}
    - Secondary emotion: (Infer from mood + weather)
    - Mental energy level: ${energyLevel} (derived from preference: ${prefs.pace})
    - Age Group: ${prefs.age}

    Reading intent:
    - Preferred language: ${prefs.language || 'English'}
    - Medium: ${prefs.preferredFormat === 'audio' ? 'Audiobook' : 'Text'}
    - Desired narrative setting: ${prefs.setting}
    - Specific Interest: ${sanitizedInterest}

    TASKS (REASON INTERNALLY)
    1. Translate the weather and time of day into literary psychology (Emotional undertone, Narrative pacing, Imagery density).
    2. Combine emotional state and mental energy to determine cognitive load tolerance and emotional arc strategy (stabilize / gently uplift / deepen / challenge safely).
    3. Determine whether the reader should stay within comfort zone or explore slightly beyond it (do NOT recommend emotionally disruptive content).

    OUTPUT REQUIREMENTS (JSON)
    4. Generate a poetic but clear one-sentence description of this reading moment. (Field: 'heading')
    5. Recommend 5 books optimized for THIS EXACT MOMENT.
       - 'genre': Use this field for the Atmospheric Role (e.g., "Grounding", "Reflective", "Immersive", "Quiet Escape").
       - 'excerpt': One-line atmosphere description (≤20 words).
       - 'reasoning': “Why now” explanation (35–45 words) explicitly referencing weather, emotion, mental energy, and setting.
    6. Anti-Recommendation (MANDATORY): Identify one type of book or specific title that would be a poor fit right now, and explain why. (Field: 'antiRecommendation')
    7. Read-Differently Insight: Explain in one sentence how at least one recommended book feels different when read in this specific weather and emotional state. (Field: 'insight')

    RULES
    - Avoid bestseller bias unless contextually perfect.
    - Do not repeat authors.
    - Use refined, calm, literary language. No marketing tone.
    - ISBN MUST be for a widely available PAPERBACK edition (ISBN-13 preferred).
  `;

  try {
    const response = await callWithRetry(async () => {
      return await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: recommendationResponseSchema,
        }
      });
    });
    
    const result = parseJSON<{ heading: string, insight: string, antiRecommendation: string, books: Book[] }>(response.text);
    
    // Post-process to ensure ebookUrl is always present (fallback to OpenLibrary)
    const processedBooks = (result.books || []).map(b => ({
        ...b,
        ebookUrl: b.ebookUrl || `https://openlibrary.org/search?q=${encodeURIComponent(b.title + ' ' + b.author)}`
    }));

    return {
        heading: result.heading || `Curated for a ${prefs.mood} ${season} day`,
        insight: result.insight || "These pages will resonate differently today.",
        antiRecommendation: result.antiRecommendation || "Avoid heavy tragedies today.",
        books: processedBooks
    };

  } catch (error: any) {
    throw new Error(formatError(error, "getBookRecommendations"));
  }
};

// --- DATASET ACCESS (GOOGLE BOOKS API) ---

// Heuristic engine to generate missing metadata for search results
const enrichBookMetadata = (title: string, author: string, genre: string, description: string): Partial<Book> => {
    const text = (title + genre + description).toLowerCase();
    
    let moodColor = '#475569'; // Slate default
    let music = 'Ambient Lo-Fi';
    let food = 'Earl Grey Tea';
    let movie = 'The Secret Life of Walter Mitty';

    // Heuristics
    if (text.includes('thriller') || text.includes('mystery') || text.includes('crime') || text.includes('murder')) {
        moodColor = '#7f1d1d'; // Red/Dark
        music = 'Tense Orchestral Scores';
        food = 'Black Coffee';
        movie = 'Knives Out';
    } else if (text.includes('romance') || text.includes('love')) {
        moodColor = '#be185d'; // Pink
        music = 'Acoustic Guitar & Vocals';
        food = 'Red Wine & Dark Chocolate';
        movie = 'Pride & Prejudice (2005)';
    } else if (text.includes('sci-fi') || text.includes('science fiction') || text.includes('space') || text.includes('future')) {
        moodColor = '#1e3a8a'; // Blue
        music = 'Synthwave / Electronic';
        food = 'Freeze-dried Ice Cream';
        movie = 'Interstellar';
    } else if (text.includes('fantasy') || text.includes('magic') || text.includes('dragon')) {
        moodColor = '#581c87'; // Purple
        music = 'Celtic Folk / Epic Fantasy';
        food = 'Hearty Stew & Ale';
        movie = 'The Lord of the Rings';
    } else if (text.includes('horror') || text.includes('scary') || text.includes('ghost')) {
        moodColor = '#000000'; // Black
        music = 'Unsettling Drones';
        food = 'Something suspicious...';
        movie = 'Hereditary';
    } else if (text.includes('history') || text.includes('historical')) {
        moodColor = '#78350f'; // Brown
        music = 'Classical Period Pieces';
        food = 'Fresh Bread & Cheese';
        movie = 'The King\'s Speech';
    } else if (text.includes('self-help') || text.includes('psychology') || text.includes('habit')) {
        moodColor = '#059669'; // Green
        music = 'Binaural Beats for Focus';
        food = 'Green Smoothie';
        movie = 'Good Will Hunting';
    } else if (text.includes('dystopian') || text.includes('apocalypse')) {
        moodColor = '#171717'; // Dark Gray
        music = 'Industrial Ambient';
        food = 'Canned Peaches';
        movie = 'Children of Men';
    } else if (text.includes('india') || text.includes('delhi') || text.includes('bombay')) {
        moodColor = '#ea580c'; // Orange
        music = 'Sitar & Tabla';
        food = 'Masala Chai';
        movie = 'The Lunchbox';
    }

    return { moodColor, musicPairing: music, foodPairing: food, moviePairing: movie };
};

const mapGoogleBook = (item: any): Book => {
    const info = item.volumeInfo;
    const saleInfo = item.saleInfo;
    const accessInfo = item.accessInfo;

    const isbnObj = info.industryIdentifiers?.find((i: any) => i.type === 'ISBN_13') || info.industryIdentifiers?.[0];
    const category = info.categories?.[0] || 'General';
    const description = info.description ? (info.description.substring(0, 200) + '...') : 'No description available.';
    
    // Enrich with heuristics
    const enriched = enrichBookMetadata(info.title, info.authors?.[0] || '', category, description);

    let thumb = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;
    if (thumb) thumb = thumb.replace('http:', 'https:');

    // Priority: Web Reader -> Preview -> Info -> OpenLibrary Search
    const webReaderLink = accessInfo?.webReaderLink;
    const previewLink = info.previewLink;
    const infoLink = info.infoLink;
    
    let ebookUrl = webReaderLink || previewLink || infoLink;
    
    // Ensure every book has a link. Fallback to Open Library if no Google Books link is found.
    if (!ebookUrl) {
        ebookUrl = `https://openlibrary.org/search?q=${encodeURIComponent(info.title + ' ' + (info.authors?.[0] || ''))}`;
    }

    return {
        title: info.title,
        author: info.authors ? info.authors.join(', ') : 'Unknown',
        isbn: isbnObj?.identifier,
        description: description,
        reasoning: `From the Global Archive: ${category}`,
        moodColor: enriched.moodColor || '#475569',
        genre: category,
        excerpt: info.searchInfo?.textSnippet || info.description?.substring(0, 100) || "Click to explore this title...",
        language: info.language,
        moviePairing: enriched.moviePairing || "Ask the Librarian",
        musicPairing: enriched.musicPairing || "Ambient Noise", 
        foodPairing: enriched.foodPairing || "Tea",
        ebookUrl: ebookUrl,
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
        // Fallback with mapped URLs
        return [...FALLBACK_TRENDING].map(b => ({
            ...b,
            ebookUrl: b.ebookUrl || `https://openlibrary.org/search?q=${encodeURIComponent(b.title + ' ' + b.author)}`
        })).sort(() => Math.random() - 0.5);
    }

    const books = data.items.map(mapGoogleBook);
    return orderByNewest ? books : books.sort(() => Math.random() - 0.5);

  } catch (error) {
    console.warn("Discovery Engine unreachable, using fallback cache.", error);
    // Fallback with mapped URLs
    return [...FALLBACK_TRENDING].map(b => ({
        ...b,
        ebookUrl: b.ebookUrl || `https://openlibrary.org/search?q=${encodeURIComponent(b.title + ' ' + b.author)}`
    })).sort(() => Math.random() - 0.5);
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