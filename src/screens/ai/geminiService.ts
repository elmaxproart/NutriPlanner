// geminiService.ts


// geminiService.ts
import axios from 'axios';

const API_KEY = 'AIzaSyBGvggNkBAPTdZJuBY0CDf5KAuk-rzWbwY'; 
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function askGemini(prompt: string): Promise<string> {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Erreur Gemini:', error.response?.data || error.message);
    } else {
      console.error('Erreur Gemini:', (error as Error).message || error);
    }
    return 'Une erreur est survenue avec Gemini.';
  }
}
