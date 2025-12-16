import React, { useState, useEffect, useRef } from 'react';
import { Chat } from '@google/genai';
import { ChatMessage, CharacterPersona } from '../types';
import { getCharacterPersona, createChatSession } from '../services/gemini';
import { Button } from './Button';

interface CharacterChatProps {
  bookTitle: string;
  author: string;
  onClose: () => void;
}

export const CharacterChat: React.FC<CharacterChatProps> = ({ bookTitle, author, onClose }) => {
  const [persona, setPersona] = useState<CharacterPersona | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  
  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Persona
  useEffect(() => {
    const init = async () => {
      try {
        const p = await getCharacterPersona(bookTitle, author);
        setPersona(p);
        setMessages([{ role: 'model', text: p.greeting }]);
        chatSession.current = createChatSession(p.systemInstruction);
      } catch (e) {
        console.error("Failed to init persona", e);
        setMessages([{ role: 'model', text: "The spirits of this book are silent right now." }]);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [bookTitle, author]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatSession.current) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const result = await chatSession.current.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', text: result.text || "..." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "*The connection fades...*" }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center space-y-4 animate-fade-in text-center p-8">
        <div className="w-12 h-12 border-4 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-300 font-serif italic text-lg">Summoning the spirit of {bookTitle}...</p>
      </div>
    );
  }

  return (
    <div className="h-[500px] flex flex-col bg-black/40 rounded-xl border border-white/10 overflow-hidden relative backdrop-blur-md">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
         <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold font-serif font-bold text-xl border border-accent-gold/30">
                 {persona?.name.charAt(0)}
             </div>
             <div>
                 <h3 className="font-bold text-white leading-none">{persona?.name}</h3>
                 <span className="text-xs text-slate-400 uppercase tracking-wider">Character Echo</span>
             </div>
         </div>
         <button onClick={onClose} className="text-slate-400 hover:text-white">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
         </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                    msg.role === 'user' 
                    ? 'bg-accent-gold text-deep-bg font-medium rounded-tr-none' 
                    : 'bg-white/10 text-slate-200 border border-white/5 rounded-tl-none font-serif'
                }`}>
                    {msg.text}
                </div>
            </div>
        ))}
        {isTyping && (
             <div className="flex justify-start">
                 <div className="bg-white/10 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 items-center">
                     <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                     <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                     <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                 </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-black/20 flex gap-2">
         <input 
           type="text" 
           value={input}
           onChange={(e) => setInput(e.target.value)}
           placeholder={`Ask ${persona?.name} a question...`}
           className="flex-1 bg-white/5 border border-slate-700 rounded-full px-4 py-3 text-white focus:outline-none focus:border-accent-gold transition-colors placeholder-slate-500"
         />
         <button 
           type="submit" 
           disabled={!input.trim()}
           className="bg-accent-gold text-deep-bg p-3 rounded-full hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
         >
             <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
         </button>
      </form>
    </div>
  );
};
