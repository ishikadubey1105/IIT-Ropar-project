import { GoogleGenAI, Type, Schema, Modality, LiveServerMessage } from "@google/genai";
import { UserPreferences, Book, WebSource } from "../types";

const parseApiKey = (): string => {
    const key = process.env.API_KEY;
    if (!key) {
        console.error("CRITICAL: API Key is missing from environment.");
    }
    return key || '';
};

const apiKey = parseApiKey();
const ai = new GoogleGenAI({ apiKey });

// --- SECURITY & UTILS ---

const sanitizeInput = (input: string): string => {
  if (!input) return "";
  return input.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim().substring(0, 300);
};

async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRetryable = error?.status === 429 || error?.status >= 500;
    if (retries > 0 && isRetryable) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// --- BOOK RECS ---

const bookSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    author: { type: Type.STRING },
    genre: { type: Type.STRING },
    description: { type: Type.STRING, description: "A brief synopsis of the book." },
    reasoning: { type: Type.STRING, description: "Why this book fits the user's specific mood and weather." },
    moodColor: { type: Type.STRING, description: "A hex color code representing the vibe of the book." },
    firstSentence: { type: Type.STRING, description: "The actual first sentence of the book." },
    excerpt: { type: Type.STRING, description: "A short, atmospheric paragraph (~50 words) capturing the essence of the book, written to be read aloud as a teaser." }
  },
  required: ["title", "author", "reasoning", "moodColor", "genre", "description", "excerpt"],
};

export const getBookRecommendations = async (prefs: UserPreferences): Promise<Book[]> => {
  if (!apiKey) throw new Error("Secure API Key configuration missing.");
  const model = "gemini-2.5-flash";
  const sanitizedInterest = sanitizeInput(prefs.specificInterest || "Surprise me");
  
  const prompt = `
    Act as an expert bibliotherapist.
    <user_context>
      <weather>${prefs.weather}</weather>
      <mood>${prefs.mood}</mood>
      <pace>${prefs.pace}</pace>
      <setting>${prefs.setting}</setting>
      <user_notes>${sanitizedInterest}</user_notes>
    </user_context>
    <instructions>
      Recommend 4 distinct books matching this specific atmospheric combination.
      For 'excerpt', write a short, captivating teaser (~50 words) capturing the *vibe*.
    </instructions>
  `;

  try {
    const response = await callWithRetry(async () => {
      return await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: { type: Type.ARRAY, items: bookSchema },
          systemInstruction: "You are Atmosphera, a secure and sophisticated AI book curator.",
        }
      });
    });
    return JSON.parse(response.text || "[]") as Book[];
  } catch (error) {
    console.error("Backend Error [Recommendations]:", error);
    throw new Error("Unable to connect to the Curatorial Backend.");
  }
};

export const searchBooks = async (query: string): Promise<Book[]> => {
  if (!apiKey) throw new Error("Secure API Key configuration missing.");
  const model = "gemini-2.5-flash";
  const sanitizedQuery = sanitizeInput(query);
  
  const prompt = `
    Act as an expert librarian.
    User Query: "${sanitizedQuery}"
    
    Instructions:
    1. Search for books that match the user's query (title, author, or topic).
    2. Recommend 4 relevant books.
    3. Ensure the output matches the required JSON schema strictly.
    4. For 'reasoning', explain why it matches the query.
    5. For 'moodColor', pick a color that fits the book's cover or vibe.
    6. For 'excerpt', generate a compelling teaser.
  `;

  try {
    const response = await callWithRetry(async () => {
      return await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: { type: Type.ARRAY, items: bookSchema },
          systemInstruction: "You are Atmosphera, a secure and sophisticated AI book curator.",
        }
      });
    });
    return JSON.parse(response.text || "[]") as Book[];
  } catch (error) {
    console.error("Backend Error [Search]:", error);
    throw new Error("Unable to search books.");
  }
};

// --- GOOGLE SEARCH GROUNDING ---

export const fetchBookDetails = async (bookTitle: string, author: string): Promise<{ summary: string; sources: WebSource[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find recent reviews, key themes, and interesting facts about the book "${bookTitle}" by ${author}. Keep it brief (2 sentences).`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const sources: WebSource[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ uri: chunk.web.uri, title: chunk.web.title });
        }
      });
    }

    return {
      summary: response.text || "No details found.",
      sources: sources.slice(0, 3) // Top 3 sources
    };
  } catch (error) {
    console.error("Search Grounding Error:", error);
    return { summary: "Could not fetch real-time info.", sources: [] };
  }
};

// --- IMAGE GENERATION & EDITING (NANO BANANA) ---

export const generateMoodImage = async (description: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Generate a high-quality, artistic, atmospheric digital painting representing this scene: ${description}. No text.` }],
      },
    });
    
    // Iterate to find image part
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};

export const editMoodImage = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    // Strip prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
          { text: prompt }
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No edited image returned");
  } catch (error) {
    console.error("Image Edit Error:", error);
    throw error;
  }
};

// --- AUDIO (TTS) ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

export const generateAudioPreview = async (text: string): Promise<AudioBuffer> => {
  const sanitizedText = sanitizeInput(text);
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: sanitizedText }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  return await decodeAudioData(decode(base64Audio), audioContext);
};

// --- LIVE API (CONVERSATIONAL) ---

export const connectToLiveLibrarian = async (
  onAudioData: (buffer: AudioBuffer) => void,
  onClose: () => void
) => {
  const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  
  // Use a separate output context for decoding received audio to avoid sample rate mismatches
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  const source = inputAudioContext.createMediaStreamSource(stream);
  const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
  
  scriptProcessor.connect(inputAudioContext.destination);
  source.connect(scriptProcessor);

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: "You are the Atmosphera Librarian. A wise, calm, and slightly mystical entity who helps users find books based on their mood and weather. Keep responses concise and atmospheric.",
    },
    callbacks: {
      onopen: () => console.log("Live Session Open"),
      onmessage: async (message: LiveServerMessage) => {
        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
           const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext);
           onAudioData(audioBuffer);
        }
      },
      onclose: () => {
        console.log("Live Session Closed");
        onClose();
        stream.getTracks().forEach(t => t.stop());
        inputAudioContext.close();
        outputAudioContext.close();
      },
      onerror: (err) => console.error("Live Error", err)
    }
  });

  scriptProcessor.onaudioprocess = (e) => {
    const inputData = e.inputBuffer.getChannelData(0);
    const l = inputData.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = inputData[i] * 32768;
    }
    
    // Send audio chunk
    sessionPromise.then(session => {
        // Simple base64 encode for PCM data
        let binary = '';
        const bytes = new Uint8Array(int16.buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const b64 = btoa(binary);

        session.sendRealtimeInput({
            media: {
                mimeType: 'audio/pcm;rate=16000',
                data: b64
            }
        });
    });
  };

  return {
    disconnect: async () => {
      const session = await sessionPromise;
      session.close();
      stream.getTracks().forEach(t => t.stop());
      source.disconnect();
      scriptProcessor.disconnect();
      inputAudioContext.close();
      outputAudioContext.close();
    }
  };
};