export interface Book {
  title: string;
  author: string;
  description: string;
  reasoning: string;
  moodColor: string;
  genre: string;
  firstSentence?: string;
  excerpt: string; // A creative generated excerpt for audio preview
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
  weather: WeatherType | null;
  mood: MoodType | null;
  pace: ReadingPace | null;
  setting: WorldSetting | null;
  specificInterest: string;
}

export interface StepProps {
  onNext: (data: Partial<UserPreferences>) => void;
  onBack: () => void;
  data: UserPreferences;
}