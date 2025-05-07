interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
}

const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3000'
  : '';

export async function generateQuiz(words: { original: string; translation: string }[]): Promise<QuizQuestion[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/gemini/quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ words }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate quiz');
    }

    return response.json();
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
}

export async function generateExplanation(word: string, translation: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/gemini/explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ word, translation }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate explanation');
    }

    const data = await response.json();
    return data.explanation;
  } catch (error) {
    console.error("Error generating explanation:", error);
    throw error;
  }
} 