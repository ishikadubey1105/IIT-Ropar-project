import React, { useState } from 'react';
import { UserPreferences, WeatherType, MoodType, ReadingPace, StepProps } from '../types';
import { Button } from './Button';

// Icons/SVGs could be their own file, but inline for simplicity in this structure
const Icons = {
  Sun: () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Cloud: () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 011-7.874V7a5 5 0 019.863-2.641 5.917 5.917 0 015.526 6.918A4.5 4.5 0 0118 19.5H6.75A4.75 4.75 0 013 15z" /></svg>,
  Rain: () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>,
  Moon: () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
};

const WeatherStep: React.FC<StepProps> = ({ onNext, data }) => {
  const options = Object.values(WeatherType);
  
  return (
    <div className="animate-fade-in space-y-8">
      <h2 className="text-3xl md:text-4xl font-serif text-center mb-2">What is the sky telling you?</h2>
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
              {option.includes('Cloudy') && <Icons.Cloud />}
              {option.includes('Night') && <Icons.Moon />}
              {/* Fallback icon for others */}
              {!option.match(/Sunny|Rainy|Cloudy|Night/) && <Icons.Cloud />}
            </div>
            <span className="font-medium">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const MoodStep: React.FC<StepProps> = ({ onNext, onBack, data }) => {
  const moods = Object.values(MoodType);
  
  return (
    <div className="animate-fade-in space-y-8">
      <h2 className="text-3xl md:text-4xl font-serif text-center mb-2">How does your soul feel?</h2>
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
    <div className="animate-fade-in space-y-8 max-w-2xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-serif text-center mb-2">Choose your tempo</h2>
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

const FinalStep: React.FC<StepProps> = ({ onNext, onBack, data }) => {
  const [interest, setInterest] = useState(data.specificInterest);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ specificInterest: interest });
  };

  return (
    <div className="animate-fade-in space-y-8 max-w-xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-serif text-center mb-2">The final touch</h2>
      <p className="text-slate-400 text-center mb-8">Any specific tropes, topics, or ingredients? (Optional)</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <input
            type="text"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            placeholder="e.g., 'A ghost story set in Paris' or 'Just surprise me'"
            className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-6 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-all"
          />
        </div>
        
        <div className="flex justify-center gap-4 pt-6">
          <Button type="button" variant="ghost" onClick={onBack}>Back</Button>
          <Button type="submit" variant="primary">Reveal Recommendations</Button>
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
    specificInterest: ''
  });

  const handleNext = (data: Partial<UserPreferences>) => {
    const newPrefs = { ...prefs, ...data };
    setPrefs(newPrefs);
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete(newPrefs);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const steps = [
    <WeatherStep key="weather" onNext={handleNext} onBack={handleBack} data={prefs} />,
    <MoodStep key="mood" onNext={handleNext} onBack={handleBack} data={prefs} />,
    <PaceStep key="pace" onNext={handleNext} onBack={handleBack} data={prefs} />,
    <FinalStep key="final" onNext={handleNext} onBack={handleBack} data={prefs} />
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12">
      {/* Progress Bar */}
      <div className="w-full h-1 bg-slate-800 rounded-full mb-12 overflow-hidden">
        <div 
          className="h-full bg-accent-gold transition-all duration-500 ease-out"
          style={{ width: `${((step + 1) / 4) * 100}%` }}
        />
      </div>
      
      {steps[step]}
    </div>
  );
};