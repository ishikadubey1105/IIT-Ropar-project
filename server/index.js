
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Gemini on the Server Side (Secure)
const getKey = () => {
    const key = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) console.warn("Warning: No Server-Side API Key found.");
    return key;
};

// Generic Passthrough for Generation
app.post('/api/generate', async (req, res) => {
    try {
        const { model, contents, config } = req.body;
        const key = getKey();

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

    } catch (error) {
        console.error("AI Generation Error:", error.message);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});

// Serve static files in production
// Serve static files regardless of mode (if built)
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback for SPA routing - only if not API request
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err) res.status(500).send("Server Error: App not built. Run 'npm run build' first.");
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Atmosphera Secure Gateway running on http://localhost:${PORT}`);
    console.log(`   - Mode: ${process.env.NODE_ENV || 'Development'}`);
    console.log(`   - API Endpoint: /api/generate\n`);
});
