
export interface Book {
  id?: string; // unique identifier (title + author slug)
  title: string;
  author: string;
  isbn?: string; // Added for fetching covers
  description: string;
  reasoning: string;
  moodColor: string;
  genre: string;
  firstSentence?: string;
  excerpt: string;
  ebookUrl?: string; // Link to the e-book if available
  moviePairing?: string; // Media recommendation based on color/vibe
  language?: string; // Added language support
  coverUrl?: string; // Direct link to cover image for optimization
  
  // Extended Metadata from Global Archive
  publisher?: string;
  publishedDate?: string;
  pageCount?: number;
  averageRating?: number;
  ratingsCount?: number;

  // E-book Specific Metadata
  isEbook?: boolean;
  saleability?: string; // 'FOR_SALE', 'FREE', 'NOT_FOR_SALE'
  price?: {
    amount: number;
    currencyCode: string;
  };
  buyLink?: string;
  accessViewStatus?: string; // 'FULL_PUBLIC_DOMAIN', 'SAMPLE', etc.
  pdfAvailable?: boolean;
  epubAvailable?: boolean;
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
  GOTHIC = 'Gothic / Eerie',
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
}

export interface StepProps {
  onNext: (data: Partial<UserPreferences>) => void;
  onBack: () => void;
  data: UserPreferences;
}
