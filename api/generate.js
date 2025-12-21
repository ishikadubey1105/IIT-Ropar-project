
import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { model, contents, config } = req.body;

        // Securely retrieve the key from environment variables (Vercel)
        const key = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

        if (!key) {
            return res.status(500).json({ error: "Server configuration error: Missing API Key" });
        }

        const ai = new GoogleGenAI({ apiKey: key });
        // @ts-ignore - Dynamic model access
        const result = await ai.models.generateContent({
            model: model || 'gemini-2.0-flash',
            contents,
            config
        });

        res.status(200).json(result);
    } catch (error) {
        console.error("AI Generation Error:", error.message);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
}
