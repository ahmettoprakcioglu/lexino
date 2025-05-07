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
    const { words } = req.body;
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Generate a vocabulary quiz with 5 multiple choice questions using these word pairs:
${words.map((w: { original: string; translation: string }) => `${w.original} - ${w.translation}`).join('\n')}

For each word, create a question that tests the understanding of the word in context.
Format your response as a JSON array with objects containing:
- question: The question text
- options: Array of 4 possible answers
- correctAnswer: The correct answer
- explanation: Brief explanation of why the answer is correct

Make sure the questions are varied and test different aspects of vocabulary knowledge (meaning, usage, context, etc.).`
    });

    const text = response?.text;
    if (!text) {
      throw new Error("No response from Gemini API");
    }

    try {
      const jsonStr = text.substring(
        text.indexOf('['),
        text.lastIndexOf(']') + 1
      );
      return res.json(JSON.parse(jsonStr));
    } catch (e) {
      console.error("Failed to parse Gemini response:", e);
      return res.status(500).json({ error: "Failed to generate quiz questions" });
    }
  } catch (error) {
    console.error("Error generating quiz:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 