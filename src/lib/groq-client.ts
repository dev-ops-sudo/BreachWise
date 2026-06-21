/**
 * Groq API Client Configuration
 * Server-side only - handles API key securely
 */

export const getGroqApiKey = (): string => {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY is not defined. Please set it in your .env file.'
    );
  }
  
  return apiKey;
};

export const groqConfig = {
  baseURL: 'https://api.groq.com/openai/v1',
};

