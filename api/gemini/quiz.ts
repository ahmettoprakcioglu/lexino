import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { words } = req.body;

    if (!words || !Array.isArray(words)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Generate a vocabulary quiz with 5 multiple choice questions using these word pairs:
${words.map((w: { original: string; translation: string }) => `${w.original} - ${w.translation}`).join('\n')}

For each word, create a question that tests the understanding of the word in context.
Format your response as a JSON array with objects containing:
- question
- options
- correctAnswer
- explanation`
    });

    const text = response?.text;

    if (!text) {
      console.error("Gemini returned no text.");
      return res.status(500).json({ error: "No response from Gemini API" });
    }

    const start = text.indexOf("[");
    const end = text.lastIndexOf("]") + 1;

    if (start === -1 || end === -1) {
      console.error("Gemini returned invalid format:", text);
      return res.status(500).json({ error: "Invalid response format" });
    }

    const jsonStr = text.substring(start, end);

    try {
      const parsed = JSON.parse(jsonStr);
      return res.status(200).json(parsed);
    } catch (err) {
      console.error("JSON parse error:", err, jsonStr);
      return res.status(500).json({ error: "Failed to parse Gemini response" });
    }
  } catch (error) {
    console.error("Quiz generation error:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}