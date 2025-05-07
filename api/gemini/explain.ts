import { Request, Response } from 'express';
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { word, translation } = req.body;
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Explain the word "${word}" (translation: ${translation}) in a clear and concise way.
Include:
1. Primary meaning
2. Common usage
3. A simple example sentence
Keep the explanation under 100 words.`
    });

    const text = response?.text;
    if (!text) {
      throw new Error("No response from Gemini API");
    }

    return res.json({ explanation: text });
  } catch (error) {
    console.error("Error generating explanation:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 