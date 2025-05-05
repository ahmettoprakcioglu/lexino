import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function checkModel() {
  try {
    const modelInfo = await genAI.models.get({ model: 'gemini-2.0-flash' });
    console.log('Model info:', modelInfo);
  } catch (error) {
    console.error('Error checking model:', error);
    // Try with models/ prefix
    try {
      const modelInfo = await genAI.models.get({ model: 'models/gemini-2.0-flash' });
      console.log('Model info with prefix:', modelInfo);
    } catch (error) {
      console.error('Error checking model with prefix:', error);
    }
  }
}

checkModel(); 