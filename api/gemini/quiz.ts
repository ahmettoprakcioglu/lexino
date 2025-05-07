import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    console.log("Gemini raw text:", text); // ✅ LOG EKLENDİ

    const start = text.indexOf("[");
    const end = text.lastIndexOf("]") + 1;

    if (start === -1 || end === -1) {
      console.error("Invalid format from Gemini:", text);
      return res.status(500).json({ error: "Invalid Gemini response format" });
    }

    const jsonStr = text.substring(start, end);

    try {
      const parsed = JSON.parse(jsonStr);
      return res.status(200).json(parsed);
    } catch (err) {
      console.error("JSON parse error:", jsonStr, err); // ✅ LOG EKLENDİ
      return res.status(500).json({ error: "Failed to parse Gemini response" });
    }
  } catch (error) {
    console.error("Quiz generation error:", error); // ✅ LOG EKLENDİ
    return res.status(500).json({ error: 'Internal server error' });
  }
}