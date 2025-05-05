import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(cors());
app.use(express.json());

// Quiz generation endpoint
app.post('/api/gemini/quiz', async (req, res) => {
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
      res.json(JSON.parse(jsonStr));
    } catch (e) {
      console.error("Failed to parse Gemini response:", e);
      res.status(500).json({ error: "Failed to generate quiz questions" });
    }
  } catch (error) {
    console.error("Error generating quiz:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Word explanation endpoint
app.post('/api/gemini/explain', async (req, res) => {
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

    res.json({ explanation: text });
  } catch (error) {
    console.error("Error generating explanation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 