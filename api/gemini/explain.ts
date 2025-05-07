import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { word, translation } = req.body;

    if (!word || !translation) {
      return res.status(400).json({ error: 'Missing "word" or "translation"' });
    }

    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Explain the word "${word}" (translation: ${translation}) in a clear and concise way.
Include:
1. Primary meaning
2. Common usage
3. A simple example sentence
Keep the explanation under 100 words.`
    });

    const text = response?.text;

    if (!text) {
      console.error("Gemini returned empty explanation");
      return res.status(500).json({ error: 'No response from Gemini API' });
    }

    return res.status(200).json({ explanation: text.trim() });
  } catch (error) {
    console.error('Error generating explanation:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}