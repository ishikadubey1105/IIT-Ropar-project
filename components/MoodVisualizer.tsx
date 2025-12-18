import React, { useState } from 'react';
import { generateMoodImage, editMoodImage } from '../services/gemini';
import { Button } from './Button';

interface MoodVisualizerProps {
  initialPrompt: string;
}

export const MoodVisualizer: React.FC<MoodVisualizerProps> = ({ initialPrompt }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const img = await generateMoodImage(initialPrompt);
      setImage(img);
    } catch (err: any) {
      setError(err.message || "The world remains invisible for now.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !editPrompt) return;
    
    setLoading(true);
    setError(null);
    try {
      const newImg = await editMoodImage(image, editPrompt);
      setImage(newImg);
      setEditPrompt('');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to alter the vision.");
    } finally {
      setLoading(false);
    }
  };

  if (!image && !loading) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-xs text-center animate-fade-in">
            {error}
          </div>
        )}
        <Button variant="outline" onClick={handleGenerate} className="w-full text-sm py-2 mt-4 border-dashed">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Visualize this World
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4 animate-fade-in">
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-xs text-center animate-fade-in">
          {error}
        </div>
      )}
      
      {loading ? (
         <div className="w-full h-48 bg-slate-700/50 rounded-lg flex items-center justify-center animate-pulse">
           <span className="text-accent-gold text-sm font-medium">Dreaming up visuals...</span>
         </div>
      ) : (
        <div className="relative group">
          <img src={image!} alt="Mood visualization" className="w-full h-auto rounded-lg shadow-lg" />
          
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
             <button 
               onClick={() => setIsEditing(!isEditing)}
               className="bg-black/80 text-white p-2 rounded-full hover:bg-accent-gold hover:text-black transition-colors shadow-xl"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
             </button>
          </div>
        </div>
      )}

      {isEditing && !loading && (
        <form onSubmit={handleEdit} className="flex gap-2">
          <input 
            type="text" 
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            placeholder="e.g. Add a retro filter..."
            className="flex-1 bg-slate-900/50 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-accent-gold outline-none"
          />
          <button type="submit" className="text-xs bg-slate-700 hover:bg-accent-gold hover:text-black px-3 py-2 rounded transition-colors font-bold">
            Apply
          </button>
        </form>
      )}
    </div>
  );
};