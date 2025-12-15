import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { UserPreferences, Book } from "../types";

const parseApiKey = (): string => {
    return process.env.API_KEY || '';
};

const apiKey = parseApiKey();
const ai = new GoogleGenAI({ apiKey });

const bookSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    author: { type: Type.STRING },
    genre: { type: Type.STRING },
    description: { type: Type.STRING, description: "A brief synopsis of the book." },
    reasoning: { type: Type.STRING, description: "Why this book fits the user's specific mood and weather." },
    moodColor: { type: Type.STRING, description: "A hex color code representing the vibe of the book (e.g., #2A4365 for a stormy sea book)." },
    firstSentence: { type: Type.STRING, description: "The actual first sentence of the book." },
    excerpt: { type: Type.STRING, description: "A short, atmospheric paragraph (~50 words) capturing the essence of the book, written to be read aloud as a teaser." }
  },
  required: ["title", "author", "reasoning", "moodColor", "genre", "description", "excerpt"],
};

export const getBookRecommendations = async (prefs: UserPreferences): Promise<Book[]> => {
  if (!apiKey) throw new Error("API Key is missing");

  const model = "gemini-2.5-flash";
  
  const prompt = `
    Act as an expert bibliotherapist.
    
    User Context:
    - Weather: ${prefs.weather}
    - Mood: ${prefs.mood}
    - Pace: ${prefs.pace}
    - Setting Preference: ${prefs.setting}
    - Interests: ${prefs.specificInterest || "Surprise me"}

    Recommend 4 distinct books matching this combination.
    Ensure diversity in authors and styles.
    
    CRITICAL: For the 'excerpt' field, write a short, captivating teaser text that captures the *vibe* of the book. It should sound poetic and immersive when read aloud.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: bookSchema,
        },
        systemInstruction: "You are Atmosphera, a sophisticated AI book curator.",
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];

    return JSON.parse(jsonText) as Book[];
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// Helper for audio decoding
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const generateAudioPreview = async (text: string): Promise<AudioBuffer> => {
  if (!apiKey) throw new Error("API Key missing");

  // Using the specialized TTS model
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Deep, storytelling voice
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const audioBuffer = await decodeAudioData(
    decode(base64Audio),
    audioContext,
    24000,
    1
  );
  
  return audioBuffer;
};