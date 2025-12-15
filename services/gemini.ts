import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserPreferences, Book } from "../types";

const parseApiKey = (): string => {
    // In a real environment, this would strictly come from process.env.API_KEY
    // Assuming process.env.API_KEY is injected by the environment.
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
    firstSentence: { type: Type.STRING, description: "The actual first sentence of the book, or a stylistic approximation if unknown." }
  },
  required: ["title", "author", "reasoning", "moodColor", "genre", "description"],
};

export const getBookRecommendations = async (prefs: UserPreferences): Promise<Book[]> => {
  if (!apiKey) {
    console.error("No API Key found.");
    throw new Error("API Key is missing");
  }

  const model = "gemini-2.5-flash";
  
  const prompt = `
    Act as an expert bibliotherapist with a deep understanding of literature, human psychology, and atmospheric aesthetics.
    
    The user is currently in this environment/state:
    - Weather: ${prefs.weather}
    - Mood: ${prefs.mood}
    - Preferred Pace: ${prefs.pace}
    - Specific Interests/Notes: ${prefs.specificInterest || "Surprise me"}

    Recommend 4 distinct books that perfectly match this specific combination.
    - If the weather is rainy and mood is sad, maybe suggest something cathartic or cozy.
    - If the weather is sunny and mood is adventurous, suggest travelogues or high fantasy.
    
    For each book, provide a hex color code that represents its "vibe" to be used as a UI background.
    Ensure the "reasoning" directly addresses the user's current weather and mood.
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
        systemInstruction: "You are Atmosphera, a sophisticated AI book curator. Your goal is to match the human soul to the written word based on environmental factors.",
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];

    const data = JSON.parse(jsonText);
    return data as Book[];
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
