
export interface Book {
  id?: string;
  title: string;
  author: string;
  isbn?: string;
  description: string;
  reasoning: string;
  moodColor: string;
  genre: string;
  excerpt: string;
  ebookUrl?: string;
  moviePairing?: string;
  musicPairing?: string;
  foodPairing?: string;
  language?: string;
  coverUrl?: string;
  
  // New Enhanced Metadata
  atmosphericRole?: string; // e.g., 'Grounding', 'Immersive', 'Energizing'
  cognitiveEffort?: 'Light' | 'Moderate' | 'Demanding';
  sectionFit?: string;
  momentFit?: string;
  
  publisher?: string;
  publishedDate?: string;
  pageCount?: number;
  averageRating?: number;
  ratingsCount?: number;

  isEbook?: boolean;
  saleability?: string;
  price?: {
    amount: number;
    currencyCode: string;
  };
  buyLink?: string;
  accessViewStatus?: string;
  pdfAvailable?: boolean;
  epubAvailable?: boolean;
}

export interface ReadingProgress {
  bookTitle: string; 
  currentPage: number;
  totalPages: number;
  percentage: number;
  lastUpdated: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface CharacterPersona {
  name: string;
  greeting: string;
  systemInstruction: string;
}

export interface WebSource {
  uri: string;
  title: string;
}

export enum WeatherType {
  SUNNY = 'Sunny & Bright',
  RAINY = 'Rainy & Melancholic',
  STORMY = 'Stormy & Intense',
  CLOUDY = 'Cloudy & Gray',
  SNOWY = 'Snowy & Quiet',
  NIGHT = 'Clear Night',
  FOGGY = 'Foggy & Mysterious',
  WINDY = 'Windy & Crisp',
  HUMID = 'Humid & Muggy',
  OVERCAST = 'Overcast & Gloomy'
}

export enum MoodType {
  HAPPY = 'Joyful',
  SAD = 'Melancholic',
  ADVENTUROUS = 'Adventurous',
  RELAXED = 'Relaxed',
  INTENSE = 'Intense',
  CONTEMPLATIVE = 'Contemplative',
  ROMANTIC = 'Romantic',
  CURIOUS = 'Curious'
}

export enum ReadingPace {
  SLOW = 'Slow burn',
  FAST = 'Fast-paced page turner',
  MEDIUM = 'Moderate pace'
}

export enum WorldSetting {
  REAL_WORLD = 'Modern Real World',
  HISTORICAL = 'Historical Past',
  FANTASY = 'High Fantasy Realm',
  SCIFI = 'Sci-Fi / Futuristic',
  DYSTOPIAN = 'Dystopian / Post-Apocalyptic',
  MAGICAL_REALISM = 'Magical Realism',
  GOTHIC = 'GOTHIC / Eerie',
  SURPRISE = 'Surprise Me'
}

export interface UserPreferences {
  age: string;
  weather: WeatherType | null;
  mood: MoodType | null;
  pace: ReadingPace | null;
  setting: WorldSetting | null;
  language: string;
  specificInterest: string;
  preferredFormat: 'text' | 'audio';
}

export interface StepProps {
  onNext: (data: Partial<UserPreferences>) => void;
  onBack: () => void;
  data: UserPreferences;
}
