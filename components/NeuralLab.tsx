
import React, { useState, useEffect } from 'react';
import { TrainingSignal } from '../types';
import { getTrainingSignals, saveTrainingSignal, clearTrainingData } from '../services/storage';

export const NeuralLab: React.FC = () => {
  const [signals, setSignals] = useState<TrainingSignal[]>([]);
  const [isLearning, setIsLearning] = useState(false);
  const [newSignal, setNewSignal] = useState({
    title: '',
    note: '',
    type: 'positive' as 'positive' | 'negative',
    weight: 50
  });

  useEffect(() => {
    setSignals(getTrainingSignals());
    const handleUpdate = () => setSignals(getTrainingSignals());
    window.addEventListener('training-updated', handleUpdate);
    return () => window.removeEventListener('training-updated', handleUpdate);
  }, []);

  const handleAddSignal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSignal.title || !newSignal.note) return;

    setIsLearning(true);
    const signal: TrainingSignal = {
      id: Math.random().toString(36).substr(2, 9),
      bookTitle: newSignal.title,
      bookAuthor: 'User Input',
      feedbackType: newSignal.type,
      contextNote: newSignal.note,
      atmosphericWeight: newSignal.weight,
      timestamp: new Date().toISOString()
    };

    setTimeout(() => {
      saveTrainingSignal(signal);
      setNewSignal({ title: '', note: '', type: 'positive', weight: 50 });
      setIsLearning(false);
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-20 animate-fade-in text-white font-sans">
      <div className="flex flex-col md:flex-row gap-12">
        
        {/* Tuning Controls */}
        <div className="flex-1 space-y-8">
           <header>
             <h1 className="text-4xl font-serif font-bold text-accent-gold mb-2">Neural Tuning Lab</h1>
             <p className="text-slate-400">Directly influence the recommendation weights of your personal literary intelligence.</p>
           </header>

           <form onSubmit={handleAddSignal} className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6 backdrop-blur-xl">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Book Reference</label>
                <input 
                  type="text" 
                  value={newSignal.title}
                  onChange={(e) => setNewSignal({...newSignal, title: e.target.value})}
                  placeholder="e.g. The Great Gatsby"
                  className="w-full bg-black/40 border border-slate-700 rounded-lg px-4 py-3 focus:border-accent-gold outline-none transition-all"
                />
              </div>

              <div className="flex gap-4">
                 <button 
                  type="button"
                  onClick={() => setNewSignal({...newSignal, type: 'positive'})}
                  className={`flex-1 py-3 rounded-lg border transition-all font-bold text-sm ${newSignal.type === 'positive' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-transparent border-slate-700 text-slate-500'}`}
                 >
                   Loved Vibe
                 </button>
                 <button 
                  type="button"
                  onClick={() => setNewSignal({...newSignal, type: 'negative'})}
                  className={`flex-1 py-3 rounded-lg border transition-all font-bold text-sm ${newSignal.type === 'negative' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-transparent border-slate-700 text-slate-500'}`}
                 >
                   Hated Vibe
                 </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Signal Context</label>
                <textarea 
                  value={newSignal.note}
                  onChange={(e) => setNewSignal({...newSignal, note: e.target.value})}
                  placeholder="Why did this work or fail? (e.g. Too melancholic for sunny days)"
                  className="w-full bg-black/40 border border-slate-700 rounded-lg px-4 py-3 h-24 focus:border-accent-gold outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Atmospheric Weight</label>
                    <span className="text-accent-gold font-mono text-sm">{newSignal.weight}%</span>
                 </div>
                 <input 
                  type="range" 
                  min="1" max="100" 
                  value={newSignal.weight}
                  onChange={(e) => setNewSignal({...newSignal, weight: parseInt(e.target.value)})}
                  className="w-full accent-accent-gold" 
                 />
              </div>

              <button 
                type="submit"
                disabled={isLearning}
                className="w-full py-4 rounded-full bg-accent-gold text-deep-bg font-bold hover:bg-white transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isLearning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-deep-bg border-t-transparent rounded-full animate-spin" />
                    Optimizing Model...
                  </>
                ) : (
                  'Inject Training Signal'
                )}
              </button>
           </form>
        </div>

        {/* Algorithm State */}
        <div className="w-full md:w-80 lg:w-96 space-y-6">
           <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Training History</h3>
                <button onClick={clearTrainingData} className="text-[10px] text-red-400 hover:underline">Reset Weights</button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 max-h-[500px] pr-2 scrollbar-hide">
                {signals.length === 0 ? (
                  <div className="text-center py-20 opacity-30 italic font-serif">
                    No signals detected. Start training to specialize the algorithm.
                  </div>
                ) : (
                  signals.slice().reverse().map(s => (
                    <div key={s.id} className="p-4 bg-black/40 rounded-xl border border-white/5 animate-slide-up group relative">
                       <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${s.feedbackType === 'positive' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <span className="text-xs font-bold text-white truncate">{s.bookTitle}</span>
                       </div>
                       <p className="text-[10px] text-slate-400 italic line-clamp-2 leading-relaxed">"{s.contextNote}"</p>
                       <div className="mt-3 flex justify-between items-center">
                          <span className="text-[8px] text-slate-600 font-mono">{new Date(s.timestamp).toLocaleDateString()}</span>
                          <span className="text-[9px] text-accent-gold font-bold">{s.atmosphericWeight}w</span>
                       </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                 <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                    <span>Model Convergence</span>
                    <span className="text-accent-gold">{Math.min(signals.length * 12, 100)}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
                    <div className="h-full bg-accent-gold transition-all duration-1000" style={{ width: `${Math.min(signals.length * 12, 100)}%` }} />
                 </div>
                 <p className="text-[9px] text-slate-600 italic">Algorithm specializes as more signals are analyzed.</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};
