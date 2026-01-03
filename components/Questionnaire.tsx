import React, { useState } from 'react';
import { UserPreferences, WeatherType, MoodType, ReadingPace, WorldSetting, StepProps } from '../types';
import { Button } from './Button';

// Icons/SVGs
const Icons = {
  Sun: () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Cloud: () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 011-7.874V7a5 5 0 019.863-2.641 5.917 5.917 0 015.526 6.918A4.5 4.5 0 0118 19.5H6.75A4.75 4.75 0 013 15z" /></svg>,
  Rain: () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>,
  Moon: () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>,
  Wind: () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" /></svg>
};

const LanguageStep: React.FC<StepProps> = ({ onNext, data }) => {
  const languages = [
    { code: "English", native: "English" },
    { code: "Hindi", native: "हिन्दी" },
    { code: "Marathi", native: "मराठी" },
    { code: "Gujarati", native: "ગુજરાતી" },
    { code: "Spanish", native: "Español" },
    { code: "French", native: "Français" },
    { code: "German", native: "Deutsch" },
    { code: "Japanese", native: "日本語" },
    { code: "Russian", native: "Русский" },
    { code: "Arabic", native: "العربية" },
    { code: "Italian", native: "Italiano" },
    { code: "Korean", native: "한국어" },
    { code: "Chinese", native: "中文" },
    { code: "Portuguese", native: "Português" },
  ];

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <h2 className="text-3xl md:text-4xl font-serif text-center mb-2 leading-tight">In which tongue shall we read?</h2>
      <p className="text-slate-400 text-center mb-8">Select your preferred language for the journey.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onNext({ language: lang.code })}
            className={`p-4 h-24 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-1 shadow-lg hover:-translate-y-1 group
              ${data.language === lang.code
                ? 'bg-accent-gold text-deep-bg border-accent-gold shadow-accent-gold/30'
                : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
              }`}
          >
            <span className="text-lg font-bold">{lang.native}</span>
            <span className={`text-xs uppercase tracking-wider ${data.language === lang.code ? 'text-black/70' : 'text-slate-500 group-hover:text-slate-400'}`}>{lang.code}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const FormatStep: React.FC<StepProps> = ({ onNext, onBack, data }) => {
  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <h2 className="text-3xl md:text-4xl font-serif text-center mb-2 leading-tight">How do you consume stories?</h2>
      <p className="text-slate-400 text-center mb-8">Choose your preferred medium.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <button
          onClick={() => onNext({ preferredFormat: 'text' })}
          className={`p-8 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-4 group
            ${data.preferredFormat === 'text'
              ? 'bg-accent-gold text-deep-bg border-accent-gold shadow-lg'
              : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-500'
            }`}
        >
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          <div className="text-center">
            <span className="text-xl font-serif font-bold block mb-1">The Written Word</span>
            <span className="text-xs uppercase tracking-widest opacity-70">Physical & E-books</span>
          </div>
        </button>

        <button
          onClick={() => onNext({ preferredFormat: 'audio' })}
          className={`p-8 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-4 group
            ${data.preferredFormat === 'audio'
              ? 'bg-accent-gold text-deep-bg border-accent-gold shadow-lg'
              : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-500'
            }`}
        >
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          <div className="text-center">
            <span className="text-xl font-serif font-bold block mb-1">The Spoken Word</span>
            <span className="text-xs uppercase tracking-widest opacity-70">Audiobooks</span>
          </div>
        </button>
      </div>
      <div className="flex justify-center mt-12">
        <Button variant="ghost" onClick={onBack}>Back</Button>
      </div>
    </div>
  );
};

const AgeStep: React.FC<StepProps> = ({ onNext, onBack, data }) => {
  const ages = [
    { label: "Under 12", value: "child", desc: "Whimsical & Safe" },
    { label: "13 - 17", value: "teen", desc: "YA & Coming of Age" },
    { label: "18 - 24", value: "young_adult", desc: "New Adult & Bold" },
    { label: "25 - 40", value: "adult", desc: "Complex & Nuanced" },
    { label: "40+", value: "mature", desc: "Classic & Deep" },
  ];

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <h2 className="text-3xl md:text-4xl font-serif text-center mb-2 leading-tight">A question of time.</h2>
      <p className="text-slate-400 text-center mb-8">Select your age group to tailor the complexity and themes.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {ages.map((item) => (
          <button
            key={item.value}
            onClick={() => onNext({ age: item.value })}
            className={`p-6 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 group
              ${data.age === item.value
                ? 'bg-accent-gold text-deep-bg border-accent-gold shadow-lg'
                : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-500'
              }`}
          >
            <span className="text-xl font-serif font-bold">{item.label}</span>
            <span className={`text-xs uppercase tracking-widest ${data.age === item.value ? 'text-black/70' : 'text-slate-500'}`}>{item.desc}</span>
          </button>
        ))}
      </div>
      <div className="flex justify-center mt-12">
        <Button variant="ghost" onClick={onBack}>Back</Button>
      </div>
    </div>
  );
};

const WeatherStep: React.FC<StepProps> = ({ onNext, onBack, data }) => {
  const options = Object.values(WeatherType);

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <h2 className="text-3xl md:text-4xl font-serif text-center mb-2 leading-tight">What is the sky telling you?</h2>
      <p className="text-slate-400 text-center mb-8">Select the current atmosphere outside your window.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onNext({ weather: option })}
            className={`p-6 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-4 group
              ${data.weather === option
                ? 'bg-accent-gold text-deep-bg border-accent-gold shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
              }`}
          >
            <div className={`transition-transform duration-300 group-hover:scale-110`}>
              {option.includes('Sunny') && <Icons.Sun />}
              {option.includes('Rainy') && <Icons.Rain />}
              {(option.includes('Cloudy') || option.includes('Overcast') || option.includes('Foggy') || option.includes('Humid')) && <Icons.Cloud />}
              {option.includes('Night') && <Icons.Moon />}
              {option.includes('Windy') && <Icons.Wind />}

              {/* Fallback logic */}
              {!option.match(/Sunny|Rainy|Cloudy|Overcast|Foggy|Humid|Night|Windy/) && <Icons.Cloud />}
            </div>
            <span className="font-medium text-center">{option}</span>
          </button>
        ))}
      </div>
      <div className="flex justify-center mt-12">
        <Button variant="ghost" onClick={onBack}>Back</Button>
      </div>
    </div>
  );
};

const MoodStep: React.FC<StepProps> = ({ onNext, onBack, data }) => {
  const moods = Object.values(MoodType);

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <h2 className="text-3xl md:text-4xl font-serif text-center mb-2 leading-tight">How does your soul feel?</h2>
      <p className="text-slate-400 text-center mb-8">Be honest. We'll find a companion for your emotion.</p>

      <div className="flex flex-wrap justify-center gap-4">
        {moods.map((mood) => (
          <button
            key={mood}
            onClick={() => onNext({ mood })}
            className={`px-6 py-3 rounded-full text-lg transition-all duration-300 
              ${data.mood === mood
                ? 'bg-white text-deep-bg font-semibold scale-110 shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
          >
            {mood}
          </button>
        ))}
      </div>

      <div className="flex justify-center mt-12">
        <Button variant="ghost" onClick={onBack}>Back</Button>
      </div>
    </div>
  );
};

const PaceStep: React.FC<StepProps> = ({ onNext, onBack, data }) => {
  return (
    <div className="animate-fade-in space-y-8 max-w-2xl mx-auto pb-12">
      <h2 className="text-3xl md:text-4xl font-serif text-center mb-2 leading-tight">Choose your tempo</h2>
      <p className="text-slate-400 text-center mb-8">How fast do you want the world to move?</p>

      <div className="space-y-4">
        {Object.values(ReadingPace).map((pace) => (
          <button
            key={pace}
            onClick={() => onNext({ pace })}
            className={`w-full p-6 text-left rounded-xl border transition-all duration-300 flex items-center justify-between group
              ${data.pace === pace
                ? 'bg-slate-700 border-accent-gold'
                : 'bg-slate-800/30 border-slate-700 hover:bg-slate-800 hover:border-slate-500'
              }`}
          >
            <span className="text-xl font-serif text-slate-200">{pace}</span>
            <div className={`w-4 h-4 rounded-full border-2 ${data.pace === pace ? 'bg-accent-gold border-accent-gold' : 'border-slate-500'}`} />
          </button>
        ))}
      </div>

      <div className="flex justify-center mt-12">
        <Button variant="ghost" onClick={onBack}>Back</Button>
      </div>
    </div>
  );
};

const SettingStep: React.FC<StepProps> = ({ onNext, onBack, data }) => {
  return (
    <div className="animate-fade-in space-y-8 max-w-3xl mx-auto pb-12">
      <h2 className="text-3xl md:text-4xl font-serif text-center mb-2 leading-tight">Where do you want to go?</h2>
      <p className="text-slate-400 text-center mb-8">Choose a setting for your journey.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.values(WorldSetting).map((setting) => (
          <button
            key={setting}
            onClick={() => onNext({ setting })}
            className={`p-4 h-32 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 text-center group
              ${data.setting === setting
                ? 'bg-slate-700 border-accent-gold text-white scale-105'
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-500'
              }`}
          >
            <span className="text-sm md:text-base font-serif font-medium">{setting}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-center mt-12">
        <Button variant="ghost" onClick={onBack}>Back</Button>
      </div>
    </div>
  );
};

const FinalStep: React.FC<StepProps> = ({ onNext, onBack, data }) => {
  const [interest, setInterest] = useState(data.specificInterest);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ specificInterest: interest });
  };

  return (
    <div className="animate-fade-in space-y-8 max-w-xl mx-auto pb-12">
      <h2 className="text-3xl md:text-4xl font-serif text-center mb-2 leading-tight">The final touch</h2>
      <p className="text-slate-400 text-center mb-8">Any specific tropes, topics, or ingredients? (Optional)</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <input
            type="text"
            value={interest}
            maxLength={100}
            onChange={(e) => setInterest(e.target.value)}
            placeholder="e.g., 'Love triangles', 'Space pirates', or 'Dragons'"
            className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-6 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-all"
          />
          <div className="text-right text-xs text-slate-500 mt-2">
            {interest.length}/100
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-4 pt-6">
          <Button type="button" variant="ghost" onClick={onBack} className="order-2 md:order-1">Back</Button>
          <Button type="submit" variant="primary" className="order-1 md:order-2">Reveal Recommendations</Button>
        </div>
      </form>
    </div>
  );
};

interface QuestionnaireProps {
  onComplete: (prefs: UserPreferences) => void;
}

export const Questionnaire: React.FC<QuestionnaireProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<UserPreferences>({
    weather: null,
    mood: null,
    pace: null,
    setting: null,
    language: 'English',
    age: '',
    specificInterest: '',
    preferredFormat: 'text' // Default to text
  });

  const handleNext = (data: Partial<UserPreferences>) => {
    const newPrefs = { ...prefs, ...data };
    setPrefs(newPrefs);
    if (step < 6) {
      setStep(step + 1);
    } else {
      onComplete(newPrefs);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const steps = [
    <LanguageStep key="lang" onNext={handleNext} onBack={handleBack} data={prefs} />,
    // FormatStep removed as per user request
    <AgeStep key="age" onNext={handleNext} onBack={handleBack} data={prefs} />,
    <WeatherStep key="weather" onNext={handleNext} onBack={handleBack} data={prefs} />,
    <MoodStep key="mood" onNext={handleNext} onBack={handleBack} data={prefs} />,
    <PaceStep key="pace" onNext={handleNext} onBack={handleBack} data={prefs} />,
    <SettingStep key="setting" onNext={handleNext} onBack={handleBack} data={prefs} />,
    <FinalStep key="final" onNext={handleNext} onBack={handleBack} data={prefs} />
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 md:py-20">
      {/* Progress Bar */}
      <div className="w-full h-1 bg-slate-800 rounded-full mb-12 overflow-hidden">
        <div
          className="h-full bg-accent-gold transition-all duration-500 ease-out"
          style={{ width: `${((step + 1) / 7) * 100}%` }}
        />
      </div>

      {steps[step]}
    </div>
  );
};