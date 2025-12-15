export interface Book {
  title: string;
  author: string;
  description: string;
  reasoning: string;
  moodColor: string;
  genre: string;
  firstSentence?: string;
}

export enum WeatherType {
  SUNNY = 'Sunny & Bright',
  RAINY = 'Rainy & Melancholic',
  STORMY = 'Stormy & Intense',
  CLOUDY = 'Cloudy & Gray',
  SNOWY = 'Snowy & Quiet',
  NIGHT = 'Clear Night',
  FOGGY = 'Foggy & Mysterious'
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

export interface UserPreferences {
  weather: WeatherType | null;
  mood: MoodType | null;
  pace: ReadingPace | null;
  specificInterest: string;
}

export interface StepProps {
  onNext: (data: Partial<UserPreferences>) => void;
  onBack: () => void;
  data: UserPreferences;
}
